import { resolveVariables } from '../utils/variableResolver.js';
import { ollamaChat, getOllamaModel } from '../../utils/ollamaClient.js';

/**
 * Local AI node — runs a prompt on a Qwen model through the local Ollama server.
 * Free, no API key. Output is { text, model, ... } so {{ollama_1.text}} works in
 * any downstream node.
 *
 * Also serves legacy "gemini" nodes from workflows saved before Gemini was
 * removed; their Gemini model names are ignored in favour of the Qwen default.
 */
export async function ollamaHandler(node, context) {
  const d = node.data || {};
  const prompt = resolveVariables(String(d.prompt ?? d.template ?? ''), context);
  const system = resolveVariables(String(d.system ?? ''), context).trim();
  const model = d.model && !/^gemini/i.test(d.model) ? d.model : getOllamaModel();
  const temperature = d.temperature !== undefined ? parseFloat(d.temperature) : 0.7;

  if (!prompt.trim()) {
    throw new Error('Local AI node: the prompt is empty.');
  }

  // Local CPU generation can take a while — say so, so the console doesn't look frozen.
  context.addLog(node.id, 'ollama', 'info', `Generating with ${model} (local, may take a moment)…`);

  const messages = [
    ...(system ? [{ role: 'system', content: system }] : []),
    { role: 'user', content: prompt }
  ];

  const result = await ollamaChat({
    messages,
    model,
    temperature: Number.isFinite(temperature) ? temperature : 0.7
  });

  // Ollama reports real token counts, so this metric is exact rather than estimated.
  const tokensUsed = result.promptTokens + result.outputTokens;
  context.metrics.tokensUsed += tokensUsed;

  return {
    text: result.text,
    model: result.model,
    prompt,
    tokensUsed,
    isLocal: true
  };
}
