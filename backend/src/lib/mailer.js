import nodemailer from 'nodemailer';
import { getConfig } from '../config/env.js';

let transporter;
let ready = false;

/**
 * Create (or return cached) Nodemailer transporter.
 * When SMTP_USER is blank in development, auto-creates an Ethereal test account
 * so emails can be previewed in the browser without a real SMTP server.
 */
export async function getTransporter() {
  if (transporter) return transporter;

  const config = getConfig();

  if (!config.smtpUser) {
    // Auto-provision an Ethereal inbox for dev/test
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    transporter._ethereal = true;
    transporter._from = config.smtpFrom || `"Skyline Dev" <${testAccount.user}>`;
    console.log(`📧 Ethereal test inbox ready — preview at https://ethereal.email/login (${testAccount.user})`);
  } else {
    transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure,
      auth: { user: config.smtpUser, pass: config.smtpPass },
    });
    transporter._from = config.smtpFrom;
  }

  ready = true;
  return transporter;
}

export function isMailerReady() {
  return ready;
}

// ---------------------------------------------------------------- Template system

const BRAND = {
  name: 'Skyline Student Club',
  color: '#6366f1',
  url: 'http://localhost:5173',
};

function layout(title, innerHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<style>
  body { margin:0; padding:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#f4f4f5; color:#18181b; }
  .wrapper { max-width:600px; margin:0 auto; padding:24px 16px; }
  .card { background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,.06); }
  .header { background: linear-gradient(135deg, ${BRAND.color}, #8b5cf6); padding:32px 28px 24px; text-align:center; }
  .header h1 { margin:0; color:#fff; font-size:22px; font-weight:700; letter-spacing:-.3px; }
  .header p { margin:8px 0 0; color:rgba(255,255,255,.8); font-size:13px; }
  .body { padding:28px; font-size:15px; line-height:1.7; color:#3f3f46; }
  .body h2 { margin:0 0 12px; font-size:18px; color:#18181b; }
  .btn { display:inline-block; padding:12px 28px; background:${BRAND.color}; color:#fff !important; text-decoration:none; border-radius:8px; font-weight:600; font-size:14px; margin:16px 0; }
  .footer { padding:20px 28px; text-align:center; font-size:12px; color:#a1a1aa; border-top:1px solid #f4f4f5; }
  .footer a { color:${BRAND.color}; text-decoration:none; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="card">
    <div class="header">
      <h1>${BRAND.name}</h1>
      <p>Your campus community platform</p>
    </div>
    <div class="body">
      ${innerHtml}
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.<br/>
      <a href="${BRAND.url}">Visit our website</a>
    </div>
  </div>
</div>
</body>
</html>`;
}

const templates = {
  membership_renewal({ name, message, link }) {
    return {
      subject: `Membership Reminder — ${BRAND.name}`,
      html: layout('Membership Reminder', `
        <h2>Hey ${name} 👋</h2>
        <p>${message}</p>
        <a href="${BRAND.url}${link}" class="btn">Renew Now</a>
      `),
    };
  },

  welcome({ name }) {
    return {
      subject: `Welcome to ${BRAND.name}!`,
      html: layout('Welcome', `
        <h2>Welcome aboard, ${name}! 🎉</h2>
        <p>Your account has been created. Explore events, shop exclusive merch, and connect with the community.</p>
        <a href="${BRAND.url}/events" class="btn">Explore Events</a>
      `),
    };
  },

  newsletter_confirm({ name, confirmUrl }) {
    return {
      subject: `Confirm your newsletter subscription — ${BRAND.name}`,
      html: layout('Confirm Subscription', `
        <h2>Hi ${name} 👋</h2>
        <p>Thanks for subscribing! Please confirm your email address to start receiving our newsletter.</p>
        <a href="${confirmUrl}" class="btn">Confirm Email</a>
        <p style="font-size:13px;color:#71717a;">If you didn't subscribe, you can safely ignore this email.</p>
      `),
    };
  },

  newsletter_campaign({ subject: _subject, bodyHtml, unsubscribeUrl }) {
    return {
      subject: _subject,
      html: layout(_subject, `
        <div>${bodyHtml}</div>
        <p style="font-size:12px;color:#a1a1aa;margin-top:32px;text-align:center;">
          <a href="${unsubscribeUrl}" style="color:#6366f1;">Unsubscribe</a> from future emails.
        </p>
      `),
    };
  },

  announcement_email({ title, bodyHtml, announcementUrl }) {
    return {
      subject: `${title} — ${BRAND.name}`,
      html: layout(title, `
        <h2>${title}</h2>
        <div>${bodyHtml}</div>
        <a href="${announcementUrl}" class="btn">Read More</a>
      `),
    };
  },

  password_reset({ name, resetUrl }) {
    return {
      subject: `Password Reset — ${BRAND.name}`,
      html: layout('Password Reset', `
        <h2>Hi ${name},</h2>
        <p>You requested a password reset. Click below to choose a new password. This link expires in 30 minutes.</p>
        <a href="${resetUrl}" class="btn">Reset Password</a>
        <p style="font-size:13px;color:#71717a;">If you didn't request this, ignore this email.</p>
      `),
    };
  },
};

/**
 * Render an email template by name.
 * @param {string} templateName
 * @param {object} payload
 * @returns {{ subject: string, html: string }}
 */
export function renderTemplate(templateName, payload) {
  const fn = templates[templateName];
  if (!fn) throw new Error(`Unknown email template: ${templateName}`);
  return fn(payload);
}

/**
 * Send an email immediately.
 * @param {{ to: string, template: string, payload: object }} opts
 */
export async function sendMail({ to, template, payload }) {
  const transport = await getTransporter();
  const { subject, html } = renderTemplate(template, payload);
  const info = await transport.sendMail({
    from: transport._from,
    to,
    subject,
    html,
  });

  // In dev, log the Ethereal preview URL
  if (transport._ethereal) {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) console.log(`  ↳ Preview: ${previewUrl}`);
  }

  return info;
}
