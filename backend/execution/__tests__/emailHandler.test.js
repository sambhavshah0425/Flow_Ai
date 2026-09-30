import { describe, it, expect, vi } from 'vitest';

const sendMail = vi.fn().mockResolvedValue({ messageId: '<id@test>', accepted: ['a@b.c'], rejected: [] });

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({ sendMail })),
    getTestMessageUrl: () => null
  }
}));

const { emailHandler } = await import('../nodeHandlers/emailHandler.js');

const ctx = (secrets = {}) => ({
  secrets,
  variables: {},
  metrics: { tokensUsed: 0 },
  addLog: () => {},
  getNodeOutput: () => undefined
});

const node = (data) => ({ id: 'email_1', data });

const CONFIGURED = {
  to: 'a@b.c',
  subject: 'hi',
  body: 'x',
  smtpHost: '{{secrets.SMTP_HOST}}',
  smtpPort: '587',
  smtpUser: '{{secrets.SMTP_USER}}',
  smtpPass: '{{secrets.SMTP_PASS}}'
};

describe('emailHandler unresolved-secret guard', () => {
  it('names the missing secret instead of leaking the placeholder to DNS', async () => {
    // Regression: with no SMTP_HOST set, the raw "{{secrets.SMTP_HOST}}"
    // reached nodemailer and failed as "getaddrinfo ENOTFOUND {{secrets.SMTP_HOST}}".
    const err = await emailHandler(node(CONFIGURED), ctx({})).catch((e) => e);
    expect(err.message).toMatch(/SMTP_HOST/);
    expect(err.message).toMatch(/Secrets Vault/i);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('reports every missing key at once, not one per run', async () => {
    const err = await emailHandler(node(CONFIGURED), ctx({ SMTP_HOST: 'smtp.gmail.com' })).catch((e) => e);
    expect(err.message).toMatch(/SMTP_USER/);
    expect(err.message).toMatch(/SMTP_PASS/);
    expect(err.message).not.toMatch(/SMTP_HOST/); // this one resolved
  });

  it('sends once every reference resolves', async () => {
    sendMail.mockClear();
    const out = await emailHandler(
      node(CONFIGURED),
      ctx({ SMTP_HOST: 'smtp.gmail.com', SMTP_USER: 'me@gmail.com', SMTP_PASS: 'app-pw' })
    );
    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(out.messageId).toBe('<id@test>');
  });

  it('still accepts literal values with no templating', async () => {
    sendMail.mockClear();
    await emailHandler(
      node({ ...CONFIGURED, smtpHost: 'smtp.gmail.com', smtpUser: 'me@gmail.com', smtpPass: 'pw' }),
      ctx({})
    );
    expect(sendMail).toHaveBeenCalledTimes(1);
  });
});
