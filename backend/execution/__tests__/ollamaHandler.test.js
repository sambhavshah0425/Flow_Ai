import { describe, it, expect, vi, afterEach } from 'vitest';
import { ollamaHandler } from '../nodeHandlers/ollamaHandler.js';

const ctx = (outputs = {}) => ({
  secrets: {},
  variables: {},
  metrics: { tokensUsed: 0 },
  addLog: () => {},
  getNodeOutput: (k) => outputs[k]
});

afterEach(() => vi.unstubAllGlobals());

describe('ollamaHandler', () => {
  it('resolves {{variables}}, calls Ollama and returns text + exact token counts', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ model: 'qwen3:1.7b', message: { content: '<think>hmm</think>A short summary.' }, prompt_eval_count: 20, eval_count: 5 })
    });
    vi.stubGlobal('fetch', fetchMock);

    const context = ctx({ text_1: { text: 'the quick brown fox' } });
    const out = await ollamaHandler({ id: 'ollama_1', data: { prompt: 'Summarize: {{text_1.text}}' } }, context);

    expect(out.text).toBe('A short summary.'); // <think> block stripped
    expect(out.tokensUsed).toBe(25);
    expect(context.metrics.tokensUsed).toBe(25);

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.messages[0].content).toBe('Summarize: the quick brown fox');
    expect(body.stream).toBe(false);
  });

  it('explains how to fix a missing model', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404, text: async () => 'model not found' }));
    await expect(ollamaHandler({ id: 'o', data: { prompt: 'hi', model: 'qwen3:4b' } }, ctx()))
      .rejects.toThrow(/ollama pull qwen3:4b/);
  });

  it('explains how to fix Ollama not running', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));
    await expect(ollamaHandler({ id: 'o', data: { prompt: 'hi' } }, ctx())).rejects.toThrow(/Can't reach Ollama/);
  });

  it('fails clearly on an empty prompt', async () => {
    await expect(ollamaHandler({ id: 'o', data: { prompt: '  ' } }, ctx())).rejects.toThrow(/prompt is empty/);
  });
});
