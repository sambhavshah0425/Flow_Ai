import { describe, it, expect, vi, beforeEach } from 'vitest';

const axiosMock = vi.fn();
vi.mock('axios', () => ({ default: (...args) => axiosMock(...args) }));

const { apiHandler } = await import('../nodeHandlers/apiHandler.js');

const ctx = {
  secrets: {},
  variables: {},
  getNodeOutput: () => undefined
};

describe('apiHandler', () => {
  beforeEach(() => axiosMock.mockReset());

  it('omits body data on GET requests so Express/strict servers do not reject null payload', async () => {
    axiosMock.mockResolvedValueOnce({ status: 200, statusText: 'OK', data: { ok: true } });

    const out = await apiHandler({ id: 'api_1', data: { url: 'https://api.example.com/health', method: 'GET' } }, ctx);
    expect(out.status).toBe(200);
    expect(out.data).toEqual({ ok: true });

    const config = axiosMock.mock.calls[0][0];
    expect(config.method).toBe('GET');
    expect('data' in config).toBe(false);
    expect(config.headers).toEqual({});
  });

  it('sends parsed JSON and Content-Type header on POST requests', async () => {
    axiosMock.mockResolvedValueOnce({ status: 201, statusText: 'Created', data: { id: 1 } });

    const out = await apiHandler(
      { id: 'api_2', data: { url: 'https://api.example.com/items', method: 'POST', body: '{"name":"flow"}' } },
      ctx
    );
    expect(out.status).toBe(201);

    const config = axiosMock.mock.calls[0][0];
    expect(config.data).toEqual({ name: 'flow' });
    expect(config.headers).toEqual({ 'Content-Type': 'application/json' });
  });
});

