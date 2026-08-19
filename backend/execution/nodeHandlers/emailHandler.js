import nodemailer from 'nodemailer';
import { resolveVariables } from '../utils/variableResolver.js';

/**
 * Email (send) node — sends an email over SMTP. Recipient/subject/body and the
 * SMTP connection all support {{templates}}, so credentials live in the encrypted
 * Secrets vault (e.g. {{secrets.SMTP_PASS}}) and never in the saved workflow.
 */
export async function emailHandler(node, context) {
  const d = node.data || {};
  const r = (v) => resolveVariables(String(v ?? ''), context).trim();

  const to = r(d.to);
  const subject = r(d.subject) || '(no subject)';
  const body = resolveVariables(String(d.body ?? d.text ?? ''), context);
  const isHtml = d.isHtml === true || d.isHtml === 'true';

  const host = r(d.smtpHost);
  const port = parseInt(r(d.smtpPort)) || 587;
  const user = r(d.smtpUser);
  const pass = r(d.smtpPass);
  const from = r(d.from) || user;

  if (!to) throw new Error('Email node: "To" recipient is required.');
  if (!host || !user || !pass) {
    throw new Error('Email node: SMTP host/user/password missing — add them to the Secrets vault (SMTP_HOST, SMTP_USER, SMTP_PASS).');
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // 465 = implicit TLS; 587 = STARTTLS
    auth: { user, pass }
  });

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    ...(isHtml ? { html: body } : { text: body })
  });

  return {
    messageId: info.messageId,
    accepted: info.accepted || [],
    rejected: info.rejected || [],
    to,
    subject,
    // Present for test/dev SMTP (e.g. Ethereal); null for real providers
    previewUrl: nodemailer.getTestMessageUrl ? nodemailer.getTestMessageUrl(info) || null : null,
    sentAt: new Date().toISOString()
  };
}
