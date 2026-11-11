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

  it('retries without think flag if Ollama returns HTTP 400 rejecting thinking mode', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 400, text: async () => '{"error":"qwen2.5:1.5b does not support think"}' })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ model: 'qwen2.5:1.5b', message: { content: 'Recovered cleanly' }, prompt_eval_count: 10, eval_count: 3 })
      });
    vi.stubGlobal('fetch', fetchMock);

    const out = await ollamaHandler({ id: 'o', data: { prompt: 'hi', model: 'qwen2.5:1.5b' } }, ctx());
    expect(out.text).toBe('Recovered cleanly');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).think).toBe(false);
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).think).toBeUndefined();
  });
});

describe('legacy gemini nodes', () => {
  it('ignore their Gemini model name and run on the default Qwen model', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ model: 'qwen3:1.7b', message: { content: 'ok' } })
    });
    vi.stubGlobal('fetch', fetchMock);

    await ollamaHandler({ id: 'gemini_1', data: { prompt: 'hi', model: 'gemini-flash-latest' } }, ctx());
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).model).toBe('qwen3:1.7b');
  });
});
