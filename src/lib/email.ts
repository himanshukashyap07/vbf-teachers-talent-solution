import nodemailer, { type Transporter } from "nodemailer";
import { appBaseUrl, siteConfig } from "@/config/site";

/**
 * SMTP email (works with Brevo, Amazon SES, Resend SMTP, Zoho, Gmail app-password, …).
 * Without SMTP_* variables nothing is sent: in development the message is printed to the
 * server console so the flow can still be tested; in production it is skipped with a warning.
 */
export const emailConfigured = Boolean(process.env.SMTP_HOST && process.env.EMAIL_FROM);

let transporter: Transporter | null = null;
function getTransporter() {
  transporter ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  return transporter;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

interface Message {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function sendEmail(msg: Message): Promise<boolean> {
  if (!emailConfigured) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`\n[email:dev] To: ${msg.to}\n[email:dev] Subject: ${msg.subject}\n${msg.text}\n`);
    } else {
      console.warn("[email] SMTP is not configured; email not sent:", msg.subject);
    }
    return false;
  }
  try {
    await getTransporter().sendMail({ from: process.env.EMAIL_FROM, ...msg });
    return true;
  } catch (err) {
    console.error("[email] send failed:", (err as Error).message);
    return false;
  }
}

function layout(heading: string, bodyHtml: string, buttonLabel: string, link: string) {
  return `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#1c2733;line-height:1.6">
  <h2 style="margin:0 0 12px">${esc(heading)}</h2>
  ${bodyHtml}
  <p style="margin:24px 0"><a href="${esc(link)}" style="background:#1f3a5f;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;display:inline-block">${esc(buttonLabel)}</a></p>
  <p style="font-size:13px;color:#555">If the button does not work, copy this link into your browser:<br>${esc(link)}</p>
  <p style="font-size:12px;color:#888;border-top:1px solid #ddd;padding-top:12px">${esc(siteConfig.name)} · ${esc(siteConfig.region)}</p>
</div>`;
}

export function sendVerificationEmail(to: string, name: string, token: string) {
  const link = `${appBaseUrl}/verify-email?token=${token}`;
  return sendEmail({
    to,
    subject: `Confirm your email — ${siteConfig.name}`,
    text: `Hello ${name},\n\nConfirm your email address by opening this link (valid for 24 hours):\n${link}\n\nIf you did not create an account, ignore this email.`,
    html: layout(
      "Confirm your email",
      `<p>Hello ${esc(name)},</p><p>Please confirm your email address to finish setting up your account. The link is valid for 24 hours.</p>`,
      "Confirm email",
      link,
    ),
  });
}

export function sendPasswordResetEmail(to: string, name: string, token: string) {
  const link = `${appBaseUrl}/reset-password?token=${token}`;
  return sendEmail({
    to,
    subject: `Reset your password — ${siteConfig.name}`,
    text: `Hello ${name},\n\nReset your password using this link (valid for 1 hour):\n${link}\n\nIf you did not ask for this, you can safely ignore this email. Your password will not change.`,
    html: layout(
      "Reset your password",
      `<p>Hello ${esc(name)},</p><p>We received a request to reset your password. The link is valid for 1 hour. If this was not you, ignore this email and your password stays the same.</p>`,
      "Choose a new password",
      link,
    ),
  });
}
