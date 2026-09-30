import { describe, it, expect, vi, beforeEach } from 'vitest';

// Controls what each model name does for a given test.
const behaviour = new Map();

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel({ model }) {
      return {
        generateContent: () => {
          const b = behaviour.get(model);
          if (b === 'hang') return new Promise(() => {}); // never settles
          if (b === 'overloaded') return Promise.reject(new Error('[503] The model is overloaded'));
          if (b === 'badkey') return Promise.reject(new Error('[401] API key not valid'));
          return Promise.resolve({ response: { text: () => `ok from ${model}` } });
        }
      };
    }
  }
}));

const { geminiHandler } = await import('../nodeHandlers/geminiHandler.js');

function makeContext() {
  const logs = [];
  return {
    ctx: {
      secrets: { GEMINI_API_KEY: 'test-key' },
      metrics: { tokensUsed: 0 },
      addLog: (nodeId, type, level, message) => logs.push({ level, message })
    },
    logs
  };
}

// Short per-attempt budget keeps the suite fast; the production default is 11s.
const node = (extra = {}) => ({
  id: 'gemini_1',
  data: { prompt: 'hello', model: 'gemini-flash-latest', geminiTimeoutMs: 200, ...extra }
});

beforeEach(() => behaviour.clear());

describe('geminiHandler timeout + fallback', () => {
  it('does not let a hung request consume the whole node budget', async () => {
    behaviour.set('gemini-flash-latest', 'hang');
    behaviour.set('gemini-3.1-flash-lite', 'ok');
    const { ctx } = makeContext();

    const started = Date.now();
    const out = await geminiHandler(node(), ctx);
    const elapsed = Date.now() - started;

    // The regression this guards: previously the first call hung until the
    // engine's 30s node timeout fired and the fallback never ran.
    expect(out.text).toBe('ok from gemini-3.1-flash-lite');
    expect(out.fallbackUsed).toBe(true);
    expect(elapsed).toBeLessThan(3000);
  });

  it('reports which model hung instead of failing anonymously', async () => {
    behaviour.set('gemini-flash-latest', 'hang');
    behaviour.set('gemini-3.1-flash-lite', 'hang');
    const { ctx, logs } = makeContext();

    await expect(geminiHandler(node(), ctx)).rejects.toThrow(/did not respond/i);
    // every attempted model is named in the logs
    expect(logs.some((l) => l.message.includes('gemini-flash-latest'))).toBe(true);
    expect(logs.some((l) => l.message.includes('gemini-3.1-flash-lite'))).toBe(true);
  });

  it('still rolls over on a genuine 503', async () => {
    behaviour.set('gemini-flash-latest', 'overloaded');
    behaviour.set('gemini-3.1-flash-lite', 'ok');
    const { ctx } = makeContext();
    const out = await geminiHandler(node(), ctx);
    expect(out.model).toBe('gemini-3.1-flash-lite');
  });

  it('fails fast on a credential error without burning the chain', async () => {
    behaviour.set('gemini-flash-latest', 'badkey');
    behaviour.set('gemini-3.1-flash-lite', 'ok');
    const { ctx } = makeContext();
    // A bad key would be rejected by every model, so it must not fall back.
    await expect(geminiHandler(node(), ctx)).rejects.toThrow(/API key not valid/);
  });

  it('returns a mock response when no API key is configured', async () => {
    const out = await geminiHandler(node(), { secrets: {}, metrics: { tokensUsed: 0 }, addLog: () => {} });
    expect(out.isMock).toBe(true);
  });
});
