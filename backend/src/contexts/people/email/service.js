import nodemailer from 'nodemailer';
import { encryptPayload, decryptPayload } from '../../../platform/lib/security.js';

export async function queueEmail(tx, config, to, template, payload) {
  return tx.emailOutbox.create({ data: { to, template, payload: encryptPayload(payload, config.refreshSecret) } });
}

export function renderEmail(template, payload) {
  switch (template) {
    case 'verify-email': return { subject: 'Verify your Skyline email', text: `Your verification code is ${payload.code}. It expires in 15 minutes.\nVerify using this link: ${payload.link}` };
    case 'reset-password': return { subject: 'Reset your Skyline password', text: `This password reset link expires in 30 minutes and works once:\n${payload.link}\nIgnore this email if you did not request it.` };
    case 'newsletter-confirm': return { subject: 'Confirm Skyline newsletter subscription', text: `Confirm your subscription: ${payload.link}\nUnsubscribe: ${payload.unsubscribeLink}` };
    default: throw new Error('Unknown email template');
  }
}

export function createEmailSender({ client, config, transport }) {
  // Construct SMTP only when the job runs; importing/building the app opens no transport.
  return async function sendOutbox() {
    transport ??= nodemailer.createTransport(config.smtp ?? {});
    const db = await client();
    const candidates = await db.emailOutbox.findMany({ where: { status: 'QUEUED', sendAfter: { lte: new Date() } }, take: 100, orderBy: { createdAt: 'asc' } });
    for (const candidate of candidates) {
      await db.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM people.email_outbox WHERE id = ${candidate.id}::uuid FOR UPDATE`;
        const item = await tx.emailOutbox.findUnique({ where: { id: candidate.id } });
        if (!item || item.status !== 'QUEUED' || item.sendAfter > new Date()) return;
        try {
          const mail = renderEmail(item.template, decryptPayload(item.payload, config.refreshSecret));
          await transport.sendMail({ from: config.mailFrom, to: item.to, ...mail,
            messageId: `<${item.id}@skyline.local>` });
          await tx.emailOutbox.update({ where: { id: item.id }, data: { status: 'SENT', attempts: { increment: 1 }, sentAt: new Date(), payload: {} } });
        } catch {
          const attempts = item.attempts + 1;
          await tx.emailOutbox.update({ where: { id: item.id }, data: { attempts,
            status: attempts >= 5 ? 'FAILED' : 'QUEUED', lastError: 'Email delivery failed',
            sendAfter: new Date(Date.now() + 30_000 * 2 ** attempts) } });
        }
      }, { isolationLevel: 'ReadCommitted', timeout: 15000 });
    }
    return candidates.length;
  };
}
