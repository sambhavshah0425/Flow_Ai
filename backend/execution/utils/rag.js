import { ollamaEmbed, getOllamaEmbedModel } from '../../utils/ollamaClient.js';

const LOCAL_DIM = 512;
export const LOCAL_EMBED_MODEL = 'local-tfidf';

/**
 * Split text into overlapping chunks, packing whole paragraphs up to ~size chars
 * and carrying a small tail overlap so context isn't lost at boundaries.
 */
export function chunkText(text, size = 900, overlap = 150) {
  const clean = String(text || '').replace(/\r/g, '').trim();
  if (!clean) return [];
  // Keep overlap sane relative to chunk size (avoids near-duplicate chunks)
  overlap = Math.max(0, Math.min(overlap, Math.floor(size * 0.3)));

  const paras = clean.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const packed = [];
  let cur = '';
  for (const p of paras) {
    if (cur && (cur.length + p.length + 2) > size) {
      packed.push(cur);
      const tail = cur.slice(Math.max(0, cur.length - overlap));
      cur = `${tail}\n\n${p}`;
    } else {
      cur = cur ? `${cur}\n\n${p}` : p;
    }
  }
  if (cur) packed.push(cur);

  // Hard-split any chunk that's still far too big (e.g. one giant paragraph)
  const out = [];
  for (const c of packed) {
    if (c.length <= size * 1.5) { out.push(c); continue; }
    for (let i = 0; i < c.length; i += size - overlap) out.push(c.slice(i, i + size));
  }
  return out;
}

/** Cosine similarity between two equal-length vectors. */
export function cosineSim(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / ((Math.sqrt(na) * Math.sqrt(nb)) || 1);
}

/**
 * Deterministic, offline bag-of-words embedding — the fallback when Ollama or
 * its embedding model is unavailable. Term-frequency into a fixed hashed
 * dimension, L2 normalized. Not as strong as neural embeddings, but retrieval
 * still works.
 */
// Common English stopwords are dropped so content words drive similarity
// (otherwise "the"/"a"/"is" dominate the term-frequency vector).
const STOPWORDS = new Set(
  ('a an and are as at be but by do does for from how in into is it its of on or over so such that the ' +
   'their then there these they this to up was were what when where which while with you your we our us ' +
   'i me my has have had will would can could should each also only not no yes about after before').split(' ')
);

export function localEmbed(text) {
  const vec = new Array(LOCAL_DIM).fill(0);
  const tokens = String(text || '').toLowerCase().match(/[a-z0-9]+/g) || [];
  for (const tok of tokens) {
    if (tok.length < 2 || STOPWORDS.has(tok)) continue;
    let h = 0;
    for (let i = 0; i < tok.length; i++) h = (h * 31 + tok.charCodeAt(i)) >>> 0;
    vec[h % LOCAL_DIM] += 1;
  }
  const norm = Math.sqrt(vec.reduce((s, x) => s + x * x, 0)) || 1;
  return vec.map((x) => x / norm);
}

/**
 * Embed an array of texts. Uses Qwen neural embeddings through Ollama, falling
 * back to the offline embedding when Ollama is unreachable or the model isn't
 * pulled. Returns { vectors, model, isLocal } where isLocal marks the offline
 * fallback.
 *
 * To keep a query in the SAME space as previously-indexed chunks, pass
 * opts.forceLocal (chunks used the fallback) or opts.model (chunks used that
 * Ollama model). With opts.model the fallback is disabled: a query embedded
 * differently from its chunks would produce meaningless similarity scores.
 */
export async function embedTexts(texts, opts = {}) {
  if (opts.forceLocal) {
    return { vectors: texts.map(localEmbed), model: LOCAL_EMBED_MODEL, isLocal: true };
  }
  if (opts.model) {
    const vectors = await ollamaEmbed(texts, { model: opts.model });
    return { vectors, model: opts.model, isLocal: false };
  }
  const model = getOllamaEmbedModel();
  try {
    const vectors = await ollamaEmbed(texts, { model });
    return { vectors, model, isLocal: false };
  } catch {
    return { vectors: texts.map(localEmbed), model: LOCAL_EMBED_MODEL, isLocal: true };
  }
}
