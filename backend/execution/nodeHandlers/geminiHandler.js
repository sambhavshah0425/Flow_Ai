import { resolveVariables } from '../utils/variableResolver.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Free-tier Gemini models used as automatic fallbacks when the selected model is
// temporarily unavailable. Ordered roughly most-capable first. All are confirmed
// to work on the free tier, so an outage on one rolls over to the next at no cost.
// Trimmed to 2: enough to survive a transient outage on the primary model
// without turning one slow/rate-limited node into 5 sequential network calls.
const FALLBACK_MODELS = [
  'gemini-flash-latest',
  'gemini-3.1-flash-lite'
];

/**
 * True for errors where trying a *different* model might succeed:
 * 503 overloaded, 429 quota/rate-limit, 500 internal, 404 retired model, or a
 * network blip. A 400/401/403 means the prompt or credentials are wrong — every
 * model would reject it, so we don't waste attempts falling back on those.
 */
function isFallbackableError(message = '') {
  const m = String(message).toLowerCase();
  return (
    m.includes('503') || m.includes('overloaded') || m.includes('high demand') || m.includes('unavailable') ||
    m.includes('429') || m.includes('quota') || m.includes('exhausted') || m.includes('rate limit') ||
    m.includes('500') || m.includes('internal error') ||
    m.includes('404') || m.includes('not found') || m.includes('no longer available') ||
    m.includes('fetch failed') || m.includes('etimedout') || m.includes('econnreset') || m.includes('network') ||
    m.includes('did not respond')
  );
}

/**
 * Per-attempt ceiling. The engine already wraps the whole handler in a 30s
 * timeout, but that guards the *node*, not each API call — so a single request
 * that hangs consumed the entire budget and the fallback chain below never got
 * to run (the symptom: a bare "timed out after 30000ms" with no per-model warn
 * logged). Bounding each attempt keeps the chain meaningful and turns a hang
 * into an attributable error.
 */
const PER_ATTEMPT_TIMEOUT_MS = 11000;

function withTimeout(promise, ms, label) {
  let timer;
  const guard = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${label} did not respond within ${ms}ms (network unreachable or model unavailable)`)),
      ms
    );
  });
  return Promise.race([promise, guard]).finally(() => clearTimeout(timer));
}

export async function geminiHandler(node, context) {
  const nodeData = node.data || {};
  const rawPrompt = nodeData.prompt || nodeData.template || 'Summarize the input data.';
  const selectedModel = nodeData.model || 'gemini-flash-latest';
  const temperature = nodeData.temperature !== undefined ? parseFloat(nodeData.temperature) : 0.7;

  // Resolve prompt variables from context
  const resolvedPrompt = resolveVariables(rawPrompt, context);

  // Retrieve Gemini API Key from secrets or env
  const apiKey = context.secrets?.GEMINI_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    // If no API key is provided, generate a simulated structured AI response so workflows execute 100% free without crashing
    const mockResponse = `[Gemini AI Response (Mock Mode - Add GEMINI_API_KEY in Secrets for live AI)]:\n\nAnalysis of prompt: "${resolvedPrompt.slice(0, 100)}..."\n\nKey Insights:\n1. Workflow execution context successfully resolved.\n2. Output pipeline ready for downstream processing.`;

    context.metrics.tokensUsed += 150;

    return {
      text: mockResponse,
      model: selectedModel,
      prompt: resolvedPrompt,
      isMock: true,
      tokensUsed: 150
    };
  }

  // Ordered attempt chain: the selected model first, then every fallback it
  // isn't already — so a transient outage on one model rolls to the next.
  const attemptChain = [selectedModel, ...FALLBACK_MODELS.filter((m) => m !== selectedModel)];

  const genAI = new GoogleGenerativeAI(apiKey);
  const triedModels = [];
  let lastError = null;

  // Split the budget across the chain so two hung attempts still land inside
  // the engine's node timeout rather than tripping it.
  const perAttemptMs = Math.min(
    parseInt(nodeData.geminiTimeoutMs) || PER_ATTEMPT_TIMEOUT_MS,
    Math.floor(28000 / Math.max(1, attemptChain.length))
  );

  for (const modelName of attemptChain) {
    triedModels.push(modelName);
    try {
      // Logged before the call so a hang is attributable to a specific model
      // instead of surfacing as an anonymous node timeout.
      context.addLog(node.id, 'gemini', 'info', `Calling model "${modelName}" (timeout ${perAttemptMs}ms)…`);
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: Number.isFinite(temperature) ? { temperature } : undefined
      });
      const response = await withTimeout(
        model.generateContent(resolvedPrompt),
        perAttemptMs,
        `Model "${modelName}"`
      );

      const aiText = response.response?.text() || '';
      const estimatedTokens = Math.ceil((resolvedPrompt.length + aiText.length) / 4);
      context.metrics.tokensUsed += estimatedTokens;

      const fallbackUsed = modelName !== selectedModel;
      if (fallbackUsed) {
        context.addLog(
          node.id, 'gemini', 'warn',
          `Model "${selectedModel}" unavailable — automatically served by fallback "${modelName}".`
        );
      }

      return {
        text: aiText,
        model: modelName,          // the model that actually produced the output
        requestedModel: selectedModel,
        fallbackUsed,
        triedModels: [...triedModels],
        prompt: resolvedPrompt,
        isMock: false,
        tokensUsed: estimatedTokens
      };
    } catch (error) {
      lastError = error;
      const retryable = isFallbackableError(error.message);
      context.addLog(
        node.id, 'gemini', 'warn',
        `Model "${modelName}" failed: ${error.message}${retryable ? ' — trying next model...' : ''}`
      );

      // Prompt/credential errors won't be fixed by another model — fail fast.
      if (!retryable) {
        throw new Error(`Gemini AI Node execution failed: ${error.message}`);
      }
      // Otherwise fall through and try the next model in the chain.
    }
  }

  throw new Error(
    `Gemini AI Node execution failed — all ${triedModels.length} models unavailable ` +
    `(${triedModels.join(', ')}). Last error: ${lastError?.message || 'unknown'}`
  );
}
