/**
 * Thin client for a local Ollama server (https://ollama.com).
 *
 * Ollama runs models such as Qwen on this machine and exposes a plain HTTP API
 * on port 11434. No API key, no cost. The backend talks to it; the browser never
 * does (Ollama has no auth, so it must not be exposed publicly).
 */

const DEFAULT_BASE_URL = 'http://localhost:11434';
const DEFAULT_MODEL = 'qwen3:1.7b';

export function getOllamaBaseUrl() {
  return (process.env.OLLAMA_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');
}

export function getOllamaModel() {
  return process.env.OLLAMA_MODEL || DEFAULT_MODEL;
}

// Qwen3 can emit a <think>...</think> reasoning block before its answer.
function stripThinking(text) {
  return String(text || '').replace(/<think>[\s\S]*?<\/think>/g, '').trim();
}

function offlineError(baseUrl) {
  return new Error(
    `Can't reach Ollama at ${baseUrl}. Make sure Ollama is installed and running ` +
    `(https://ollama.com), then run: ollama pull ${getOllamaModel()}`
  );
}

/**
 * Send a chat request to Ollama and return the reply text plus token counts.
 *
 * @param {object}   opts
 * @param {Array}    opts.messages     [{ role: 'system'|'user'|'assistant', content }]
 * @param {string}  [opts.model]       defaults to OLLAMA_MODEL / qwen3:1.7b
 * @param {object}  [opts.format]      JSON schema to force structured output
 * @param {number}  [opts.temperature]
 * @param {number}  [opts.numCtx]      context window; Ollama's default is small
 * @param {number}  [opts.timeoutMs]   local CPU models can be slow
 */
export async function ollamaChat({
  messages,
  model = getOllamaModel(),
  format,
  temperature = 0.3,
  numCtx = 8192,
  timeoutMs = 180000
}) {
  const baseUrl = getOllamaBaseUrl();

  let res;
  try {
    res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        think: false, // skip Qwen3's slow "thinking" mode
        keep_alive: '30m', // keep the model in RAM between messages (reloading is slow)
        ...(format && { format }),
        options: { temperature, num_ctx: numCtx }
      })
    });
  } catch (err) {
    if (err.name === 'TimeoutError') {
      throw new Error(`Ollama model "${model}" did not respond within ${Math.round(timeoutMs / 1000)}s.`);
    }
    throw offlineError(baseUrl);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    if (res.status === 404 || /not found/i.test(body)) {
      throw new Error(`Model "${model}" is not installed in Ollama. Run: ollama pull ${model}`);
    }
    throw new Error(`Ollama error ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  return {
    text: stripThinking(data.message?.content),
    model: data.model || model,
    promptTokens: data.prompt_eval_count || 0,
    outputTokens: data.eval_count || 0
  };
}

/**
 * Load the model and pre-read `systemPrompt` without waiting for a real answer
 * (generates 1 token). Ollama caches the processed prompt, so the user's next
 * chat message that starts with the same system prompt skips straight to
 * generating. Never throws — warm-up is best-effort.
 *
 * Uses the same num_ctx as ollamaChat(): a different context size would make
 * Ollama reload the model and throw the cache away.
 */
export async function ollamaWarmup(systemPrompt, { model = getOllamaModel(), numCtx = 8192 } = {}) {
  try {
    await fetch(`${getOllamaBaseUrl()}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(180000),
      body: JSON.stringify({
        model,
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: 'hi' }],
        stream: false,
        think: false,
        keep_alive: '30m',
        options: { num_ctx: numCtx, num_predict: 1 }
      })
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Report whether Ollama is reachable and whether the configured model is pulled.
 * Never throws — used by the UI to show an "online / offline" badge.
 */
export async function ollamaStatus() {
  const baseUrl = getOllamaBaseUrl();
  const model = getOllamaModel();
  try {
    const res = await fetch(`${baseUrl}/api/tags`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return { online: false, model, modelInstalled: false, models: [] };
    const data = await res.json();
    const models = (data.models || []).map((m) => m.name);
    const wanted = model.includes(':') ? model : `${model}:latest`;
    return { online: true, model, modelInstalled: models.includes(wanted), models };
  } catch {
    return { online: false, model, modelInstalled: false, models: [] };
  }
}
