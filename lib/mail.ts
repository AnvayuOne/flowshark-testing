import 'server-only';
import nodemailer from 'nodemailer';

const g = globalThis as unknown as { __mailer?: nodemailer.Transporter };

function transporter() {
  if (!process.env.SMTP_HOST) return null;
  if (!g.__mailer) {
    const port = Number(process.env.SMTP_PORT || 465);
    g.__mailer = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
  }
  return g.__mailer;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export async function sendActionEmail(opts: { to: string; subject: string; intro: string; buttonText: string; url: string; footer: string }) {
  const text = `${opts.intro}\n\n${opts.buttonText}: ${opts.url}\n\n${opts.footer}`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;color:#0f172a">
  <h2 style="margin:0 0 12px">Anvayu Test Tracker</h2>
  <p>${esc(opts.intro)}</p>
  <p style="margin:24px 0"><a href="${esc(opts.url)}" style="background:#2a55db;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">${esc(opts.buttonText)}</a></p>
  <p style="font-size:12px;color:#64748b">${esc(opts.footer)}</p>
  <p style="font-size:12px;color:#64748b;word-break:break-all">${esc(opts.url)}</p></div>`;

  const t = transporter();
  if (!t) {
    if (process.env.NODE_ENV === 'production') throw new Error('Email is not configured (set SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM)');
    console.log(`\n[dev email] To: ${opts.to}\nSubject: ${opts.subject}\n${opts.url}\n`);
    return;
  }
  await t.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to: opts.to, subject: opts.subject, text, html });
}
