import { resolveVariables } from '../utils/variableResolver.js';
import { chunkText, embedTexts } from '../utils/rag.js';

const MAX_CHUNKS = 60; // cap embed calls per node for cost/latency safety

/**
 * Embed & Index node — chunks the input text, embeds each chunk, and stores the
 * vectors on the ExecutionContext so a downstream Retrieve node can search them.
 * Uses Qwen embeddings via Ollama, else a free offline fallback.
 */
export async function embedHandler(node, context) {
  const d = node.data || {};
  const raw = d.text || d.content || '{{pdf.text}}';
  const text = resolveVariables(String(raw), context);

  let chunks = chunkText(text, parseInt(d.chunkSize) || 900, parseInt(d.overlap) || 150);
  let capped = false;
  if (chunks.length > MAX_CHUNKS) {
    chunks = chunks.slice(0, MAX_CHUNKS);
    capped = true;
  }

  if (chunks.length === 0) {
    return { chunks: 0, model: 'none', isLocal: true, indexedChars: 0, note: 'No text to index — check the upstream source.' };
  }

  const { vectors, model, isLocal } = await embedTexts(chunks);
  if (isLocal) {
    context.addLog(node.id, 'embed', 'warn', 'Ollama embedding model unavailable — used the offline keyword embedding instead.');
  }

  context.vectorStore = context.vectorStore || [];
  chunks.forEach((t, i) => context.vectorStore.push({ text: t, vector: vectors[i] }));
  // Remember how these chunks were embedded so a query lands in the same space
  context.vectorStoreMeta = { model, isLocal };

  context.metrics.tokensUsed += Math.ceil(text.length / 4);

  if (capped) {
    context.addLog(node.id, 'embed', 'warn', `Document exceeded ${MAX_CHUNKS} chunks — indexed the first ${MAX_CHUNKS}.`);
  }

  return {
    chunks: chunks.length,
    model,
    isLocal,
    indexedChars: text.length,
    capped
  };
}
