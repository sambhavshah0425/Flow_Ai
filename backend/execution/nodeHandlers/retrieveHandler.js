import { resolveVariables } from '../utils/variableResolver.js';
import { embedTexts, cosineSim } from '../utils/rag.js';

/**
 * Retrieve node — embeds the query with the SAME method used to index, ranks the
 * stored chunks by cosine similarity, and outputs the top-K as `context` (ready
 * to drop into a Gemini prompt via {{retrieve.context}}) plus scored matches.
 */
export async function retrieveHandler(node, context) {
  const d = node.data || {};
  const query = resolveVariables(String(d.query || ''), context);
  const topK = Math.max(1, parseInt(d.topK) || 4);
  const store = context.vectorStore || [];

  if (!query.trim()) {
    return { context: '', matches: [], count: 0, query, note: 'Empty query.' };
  }
  if (store.length === 0) {
    return { context: '', matches: [], count: 0, query, note: 'No indexed content — add an Embed & Index node upstream.' };
  }

  const apiKey = context.secrets?.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  const meta = context.vectorStoreMeta || {};
  const { vectors } = await embedTexts([query], apiKey, { forceLocal: meta.isLocal, model: meta.model });
  const qv = vectors[0];

  const ranked = store
    .map((item) => ({ text: item.text, score: cosineSim(qv, item.vector) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return {
    query,
    context: ranked.map((r) => r.text).join('\n\n---\n\n'),
    matches: ranked.map((r) => ({ score: +r.score.toFixed(4), preview: r.text.slice(0, 90).replace(/\s+/g, ' ') })),
    count: ranked.length,
    fromChunks: store.length
  };
}
