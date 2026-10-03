import { randomToken, hashToken } from '../../../platform/lib/security.js';
import { transaction } from '../../../platform/db/clients.js';
import { AppError } from '../../../platform/errors/AppError.js';
import { queueEmail } from '../email/service.js';

export async function optInAtRegistration(tx, user, config, metadata) {
  const token = randomToken();
  const unsubscribeToken = randomToken();
  const subscriber = await tx.newsletterSubscriber.create({ data: { userId: user.id, name: user.name,
    email: user.email, confirmTokenHash: hashToken(token, config.refreshSecret),
    confirmExpiresAt: new Date(Date.now() + 24 * 3600000), unsubscribeTokenHash: hashToken(unsubscribeToken, config.refreshSecret) } });
  await tx.newsletterConsent.create({ data: { subscriberId: subscriber.id, action: 'OPT_IN', source: 'SIGNUP_FORM', ...metadata } });
  await queueEmail(tx, config, user.email, 'newsletter-confirm', {
    link: `${config.corsOrigin}/newsletter/confirm?token=${token}`,
    unsubscribeLink: `${config.corsOrigin}/newsletter/unsubscribe?token=${unsubscribeToken}`,
  });
}

export function createNewsletterService({ client, config }) {
  return {
    async confirm(token, metadata) {
      return transaction(await client(), async (tx) => {
        const subscriber = await tx.newsletterSubscriber.findFirst({ where: {
          confirmTokenHash: hashToken(token, config.refreshSecret), status: 'PENDING_CONFIRMATION', confirmExpiresAt: { gt: new Date() } } });
        if (!subscriber) throw new AppError('TOKEN_INVALID', 400, 'Confirmation token is invalid or expired');
        await tx.newsletterSubscriber.update({ where: { id: subscriber.id }, data: { status: 'SUBSCRIBED', confirmTokenHash: null, confirmExpiresAt: null } });
        await tx.newsletterConsent.create({ data: { subscriberId: subscriber.id, action: 'CONFIRM', source: 'EMAIL_LINK', ...metadata } });
      });
    },
    async unsubscribe(token, metadata) {
      return transaction(await client(), async (tx) => {
        const subscriber = await tx.newsletterSubscriber.findUnique({ where: { unsubscribeTokenHash: hashToken(token, config.refreshSecret) } });
        if (!subscriber || subscriber.status === 'UNSUBSCRIBED') return;
        await tx.newsletterSubscriber.update({ where: { id: subscriber.id }, data: { status: 'UNSUBSCRIBED', confirmTokenHash: null, confirmExpiresAt: null } });
        await tx.newsletterConsent.create({ data: { subscriberId: subscriber.id, action: 'OPT_OUT', source: 'EMAIL_LINK', ...metadata } });
      });
    },
  };
}
