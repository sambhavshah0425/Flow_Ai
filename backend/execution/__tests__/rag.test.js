import { describe, it, expect, vi, afterEach } from 'vitest';
import { embedTexts, LOCAL_EMBED_MODEL } from '../utils/rag.js';

afterEach(() => vi.unstubAllGlobals());

describe('embedTexts', () => {
  it('embeds a batch in one Ollama /api/embed call', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ embeddings: [[1, 0], [0, 1]] })
    });
    vi.stubGlobal('fetch', fetchMock);

    const out = await embedTexts(['a', 'b']);
    expect(out).toEqual({ vectors: [[1, 0], [0, 1]], model: 'qwen3-embedding:0.6b', isLocal: false });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/embed$/);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).input).toEqual(['a', 'b']);
  });

  it('falls back to the offline embedding when Ollama is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));
    const out = await embedTexts(['hello world']);
    expect(out.isLocal).toBe(true);
    expect(out.model).toBe(LOCAL_EMBED_MODEL);
    expect(out.vectors[0]).toHaveLength(512);
  });

  it('does not silently switch spaces when a query must match an Ollama-indexed store', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));
    await expect(embedTexts(['q'], { model: 'qwen3-embedding:0.6b' })).rejects.toThrow(/Can't reach Ollama/);
  });

  it('uses the offline embedding without calling Ollama when forced', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const out = await embedTexts(['q'], { forceLocal: true });
    expect(out.isLocal).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
