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

export function getOllamaCopilotModel() {
  return process.env.OLLAMA_COPILOT_MODEL || getOllamaModel();
}

// Qwen3 can emit a <think>...</think> reasoning block (or an unclosed <think> if truncated).
function stripThinking(text) {
  return String(text || '')
    .replace(/<think>[\s\S]*?<\/think>/g, '')
    .replace(/<think>[\s\S]*$/g, '')
    .trim();
}

/**
 * Parse a JSON object from model output, tolerating markdown code fences or
 * stray leading/trailing prose around a JSON object.
 */
export function parseJsonResponse(text) {
  const cleaned = stripThinking(text)
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  if (!cleaned) return null;

  try {
    return JSON.parse(cleaned);
  } catch {
    // Recover an embedded JSON object if prose wrapped it.
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
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
 * @param {Array}    opts.messages      [{ role: 'system'|'user'|'assistant', content }]
 * @param {string}  [opts.model]        defaults to OLLAMA_MODEL / qwen3:1.7b
 * @param {object|string} [opts.format] JSON schema or 'json' to force structured output
 * @param {number}  [opts.temperature]
 * @param {number}  [opts.topP]
 * @param {number}  [opts.repeatPenalty]
 * @param {number}  [opts.numPredict]   max tokens to generate (bounds CPU latency)
 * @param {number}  [opts.numCtx]       context window; Ollama's default is small
 * @param {number}  [opts.timeoutMs]    local CPU models can be slow
 */
/**
 * Post to Ollama's /api/chat endpoint, retrying without `think: false` if an
 * older Ollama server or non-thinking model rejects that field with HTTP 400.
 */
async function postChatPayload(baseUrl, payload, timeoutMs) {
  const send = async (includeThink) => {
    try {
      return await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(timeoutMs),
        body: JSON.stringify({
          ...payload,
          ...(includeThink ? { think: false } : {})
        })
      });
    } catch (err) {
      if (err.name === 'TimeoutError') {
        throw new Error(`Ollama model "${payload.model}" did not respond within ${Math.round(timeoutMs / 1000)}s.`);
      }
      throw offlineError(baseUrl);
    }
  };

  let res = await send(true);
  if (!res.ok) {
    let body = await res.text().catch(() => '');
    if (res.status === 400 && /think/i.test(body)) {
      res = await send(false);
      if (!res.ok) {
        body = await res.text().catch(() => '');
      }
    }
    if (!res.ok) {
      if (res.status === 404 || /not found/i.test(body)) {
        throw new Error(`Model "${payload.model}" is not installed in Ollama. Run: ollama pull ${payload.model}`);
      }
      throw new Error(`Ollama error ${res.status}: ${body.slice(0, 300)}`);
    }
  }
  return res.json();
}

export async function ollamaChat({
  messages,
  model = getOllamaModel(),
  format,
  temperature = 0.25,
  topP = 0.85,
  repeatPenalty = 1.1,
  numPredict,
  numCtx = 4096,
  timeoutMs = 180000
}) {
  const options = {
    temperature,
    top_p: topP,
    repeat_penalty: repeatPenalty,
    num_ctx: numCtx,
    ...(Number.isFinite(numPredict) && numPredict > 0 ? { num_predict: Math.round(numPredict) } : {})
  };

  const data = await postChatPayload(
    getOllamaBaseUrl(),
    {
      model,
      messages,
      stream: false,
      keep_alive: '30m', // keep the model in RAM between messages (reloading is slow)
      ...(format && { format }),
      options
    },
    timeoutMs
  );

  return {
    text: stripThinking(data.message?.content),
    model: data.model || model,
    promptTokens: data.prompt_eval_count || 0,
    outputTokens: data.eval_count || 0
  };
}

const DEFAULT_EMBED_MODEL = 'qwen3-embedding:0.6b';

export function getOllamaEmbedModel() {
  return process.env.OLLAMA_EMBED_MODEL || DEFAULT_EMBED_MODEL;
}

/**
 * Embed a batch of texts in one call via Ollama's /api/embed.
 * Returns one vector per input, in order. Throws with a "how to fix" message
 * when Ollama is offline or the embedding model hasn't been pulled.
 */
export async function ollamaEmbed(texts, { model = getOllamaEmbedModel(), timeoutMs = 150000 } = {}) {
  const baseUrl = getOllamaBaseUrl();

  let res;
  try {
    res = await fetch(`${baseUrl}/api/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
      body: JSON.stringify({ model, input: texts, keep_alive: '30m' })
    });
  } catch (err) {
    if (err.name === 'TimeoutError') {
      throw new Error(`Ollama embedding model "${model}" did not respond within ${Math.round(timeoutMs / 1000)}s.`);
    }
    throw offlineError(baseUrl);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    if (res.status === 404 || /not found/i.test(body)) {
      throw new Error(`Embedding model "${model}" is not installed in Ollama. Run: ollama pull ${model}`);
    }
    throw new Error(`Ollama error ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  if (!Array.isArray(data.embeddings) || data.embeddings.length !== texts.length) {
    throw new Error('Ollama returned an unexpected embedding response.');
  }
  return data.embeddings;
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
export async function ollamaWarmup(systemPrompt, { model = getOllamaModel(), numCtx = 4096 } = {}) {
  try {
    await postChatPayload(
      getOllamaBaseUrl(),
      {
        model,
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: 'hi' }],
        stream: false,
        keep_alive: '30m',
        options: { num_ctx: numCtx, num_predict: 1 }
      },
      180000
    );
    return true;
  } catch {
    return false;
  }
}

function isModelInstalled(installedModels, targetModel) {
  if (!targetModel) return false;
  const wanted = targetModel.includes(':') ? targetModel : `${targetModel}:latest`;
  return installedModels.some((name) => {
    if (name === targetModel || name === wanted) return true;
    const shortName = name.replace(/^registry\.ollama\.ai\/library\//i, '');
    return shortName === targetModel || shortName === wanted;
  });
}

/**
 * Report whether Ollama is reachable and whether the configured model is pulled.
 * Never throws — used by the UI to show an "online / offline" badge.
 */
export async function ollamaStatus(targetModel) {
  const baseUrl = getOllamaBaseUrl();
  const model = targetModel || getOllamaModel();
  try {
    const res = await fetch(`${baseUrl}/api/tags`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return { online: false, baseUrl, model, modelInstalled: false, models: [] };
    const data = await res.json();
    const models = (data.models || []).map((m) => m.name);
    return { online: true, baseUrl, model, modelInstalled: isModelInstalled(models, model), models };
  } catch {
    return { online: false, baseUrl, model, modelInstalled: false, models: [] };
  }
}
