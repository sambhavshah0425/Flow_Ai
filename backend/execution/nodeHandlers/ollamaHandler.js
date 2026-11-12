import { resolveVariables } from '../utils/variableResolver.js';
import { ollamaChat, getOllamaModel } from '../../utils/ollamaClient.js';
import { toPlainEnglish } from '../../utils/plainText.js';

const FORMAT_SYSTEM_INSTRUCTIONS = {
  text: '',
  concise:
    'Write in simple, clear plain English with no Markdown symbols (no **, *, #, or backticks). Be accurate, direct, and concise with no filler.',
  json:
    'Return ONLY a valid JSON object or array matching the requested fields. Do not include prose, explanations, or markdown outside the JSON.',
  rag_grounded:
    'Write in simple plain English with no Markdown symbols (no **, *, #, or backticks). Answer strictly and exclusively using facts present in the provided context. If the answer is missing from the context, reply exactly: "Not found in the provided context." Never invent facts.'
};

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
  const userSystem = resolveVariables(String(d.system ?? ''), context).trim();
  const responseFormat = Object.prototype.hasOwnProperty.call(FORMAT_SYSTEM_INSTRUCTIONS, d.responseFormat)
    ? d.responseFormat
    : 'text';
  const formatInstruction = FORMAT_SYSTEM_INSTRUCTIONS[responseFormat];
  const system = [formatInstruction, userSystem].filter(Boolean).join('\n\n');

  const model = d.model && !/^gemini/i.test(d.model) ? d.model : getOllamaModel();
  const parsedTemp = d.temperature !== undefined ? parseFloat(d.temperature) : 0.2;
  const temperature = Number.isFinite(parsedTemp) ? parsedTemp : 0.2;
  const parsedMaxTokens = d.maxTokens !== undefined && d.maxTokens !== '' ? parseInt(d.maxTokens, 10) : 768;
  const numPredict = Number.isFinite(parsedMaxTokens) && parsedMaxTokens > 0 ? parsedMaxTokens : undefined;

  const parsedNumCtx = d.numCtx !== undefined ? parseInt(d.numCtx, 10) : NaN;
  const autoNumCtx = prompt.length + system.length > 3500 || responseFormat === 'rag_grounded' ? 4096 : 2048;
  const numCtx = Number.isFinite(parsedNumCtx) && parsedNumCtx >= 512 ? parsedNumCtx : autoNumCtx;

  if (!prompt.trim()) {
    throw new Error('Local AI node: the prompt is empty.');
  }

  // Local CPU generation can take a while — say so, so the console doesn't look frozen.
  context.addLog(node.id, 'ollama', 'info', `Generating with ${model} (${responseFormat}, local)…`);

  const messages = [
    ...(system ? [{ role: 'system', content: system }] : []),
    { role: 'user', content: prompt }
  ];

  const result = await ollamaChat({
    messages,
    model,
    temperature,
    ...(responseFormat === 'json' ? { format: 'json' } : {}),
    ...(numPredict !== undefined ? { numPredict } : {}),
    numCtx
  });

  // Ollama reports real token counts, so this metric is exact rather than estimated.
  const tokensUsed = result.promptTokens + result.outputTokens;
  context.metrics.tokensUsed += tokensUsed;

  const cleanText = responseFormat === 'json' ? result.text : toPlainEnglish(result.text);

  return {
    text: cleanText,
    model: result.model,
    prompt,
    responseFormat,
    tokensUsed,
    isLocal: true
  };
}
