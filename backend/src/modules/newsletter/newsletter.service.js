import crypto from 'node:crypto';
import { AppError } from '../../lib/AppError.js';

export function createNewsletterService({ prisma, config }) {
  const hashToken = (tok) => crypto.createHash('sha256').update(tok).digest('hex');
  const genToken = () => crypto.randomBytes(24).toString('hex');
  const frontendUrl = config?.corsOrigin || 'http://localhost:5173';

  // Helper to convert simple markdown to HTML safely for emails
  function mdToHtml(md = '') {
    return md
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/^### (.*$)/gim, '<h3 style="color:#18181b;margin:16px 0 8px;">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 style="color:#18181b;margin:20px 0 10px;">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 style="color:#18181b;margin:24px 0 12px;">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" style="color:#6366f1;text-decoration:underline;">$1</a>')
      .split(/\n\n+/)
      .map((p) => `<p style="margin:0 0 14px;line-height:1.6;">${p.replace(/\n/g, '<br/>')}</p>`)
      .join('');
  }

  return {
    async subscribe({ email, name = 'Subscriber', ip, userAgent }) {
      const normalizedEmail = email.trim().toLowerCase();
      const existing = await prisma.newsletterSubscriber.findUnique({
        where: { email: normalizedEmail },
      });

      if (existing && existing.status === 'SUBSCRIBED') {
        return { message: 'You are already subscribed to our newsletter.', status: 'ALREADY_SUBSCRIBED' };
      }

      const rawConfirmToken = genToken();
      const confirmTokenHash = hashToken(rawConfirmToken);
      const rawUnsubToken = genToken();
      const unsubscribeTokenHash = hashToken(rawUnsubToken);

      let subscriber;
      if (existing) {
        subscriber = await prisma.newsletterSubscriber.update({
          where: { id: existing.id },
          data: {
            name: name || existing.name,
            status: 'PENDING_CONFIRMATION',
            confirmTokenHash,
            unsubscribeTokenHash,
          },
        });
      } else {
        subscriber = await prisma.newsletterSubscriber.create({
          data: {
            email: normalizedEmail,
            name,
            status: 'PENDING_CONFIRMATION',
            confirmTokenHash,
            unsubscribeTokenHash,
          },
        });
      }

      // Record consent
      await prisma.newsletterConsent.create({
        data: {
          subscriberId: subscriber.id,
          action: 'OPT_IN',
          source: 'SIGNUP_FORM',
          ip,
          userAgent,
        },
      });

      // Queue confirmation email
      const confirmUrl = `${frontendUrl}/newsletter/confirm?token=${rawConfirmToken}`;
      await prisma.emailOutbox.create({
        data: {
          to: normalizedEmail,
          template: 'newsletter_confirm',
          payload: {
            name: subscriber.name,
            confirmUrl,
          },
        },
      });

      return {
        message: 'Subscription initiated! Please check your email to confirm your subscription.',
        status: 'PENDING_CONFIRMATION',
      };
    },

    async confirmSubscription({ token, ip, userAgent }) {
      const hashed = hashToken(token);
      const subscriber = await prisma.newsletterSubscriber.findFirst({
        where: {
          OR: [
            { confirmTokenHash: hashed },
            { confirmTokenHash: token },
          ],
        },
      });

      if (!subscriber) {
        throw new AppError('INVALID_TOKEN', 400, 'Invalid or expired confirmation link');
      }

      await prisma.newsletterSubscriber.update({
        where: { id: subscriber.id },
        data: {
          status: 'SUBSCRIBED',
          confirmTokenHash: null,
        },
      });

      await prisma.newsletterConsent.create({
        data: {
          subscriberId: subscriber.id,
          action: 'CONFIRM',
          source: 'EMAIL_LINK',
          ip,
          userAgent,
        },
      });

      return { message: 'Subscription confirmed successfully! Welcome to Skyline newsletter.' };
    },

    async unsubscribe({ token, ip, userAgent }) {
      const hashed = hashToken(token);
      const subscriber = await prisma.newsletterSubscriber.findFirst({
        where: {
          OR: [
            { unsubscribeTokenHash: hashed },
            { unsubscribeTokenHash: token },
          ],
        },
      });

      if (!subscriber) {
        throw new AppError('INVALID_TOKEN', 400, 'Invalid unsubscribe link');
      }

      await prisma.newsletterSubscriber.update({
        where: { id: subscriber.id },
        data: {
          status: 'UNSUBSCRIBED',
        },
      });

      await prisma.newsletterConsent.create({
        data: {
          subscriberId: subscriber.id,
          action: 'OPT_OUT',
          source: 'EMAIL_LINK',
          ip,
          userAgent,
        },
      });

      return { message: 'You have been unsubscribed from the newsletter.' };
    },

    async getSubscribersStats() {
      const [total, subscribed, pending, unsubscribed] = await Promise.all([
        prisma.newsletterSubscriber.count(),
        prisma.newsletterSubscriber.count({ where: { status: 'SUBSCRIBED' } }),
        prisma.newsletterSubscriber.count({ where: { status: 'PENDING_CONFIRMATION' } }),
        prisma.newsletterSubscriber.count({ where: { status: 'UNSUBSCRIBED' } }),
      ]);

      const campaignCount = await prisma.newsletterCampaign.count();
      const sentCampaigns = await prisma.newsletterCampaign.count({ where: { status: 'SENT' } });

      return {
        subscribers: {
          total,
          subscribed,
          pending,
          unsubscribed,
        },
        campaigns: {
          total: campaignCount,
          sent: sentCampaigns,
        },
      };
    },

    async listSubscribers({ page = 1, limit = 20, status, search }) {
      const skip = (page - 1) * limit;
      const where = {};
      if (status) where.status = status;
      if (search) {
        where.OR = [
          { email: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [data, total] = await Promise.all([
        prisma.newsletterSubscriber.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            email: true,
            name: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        prisma.newsletterSubscriber.count({ where }),
      ]);

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    },

    async listCampaigns({ page = 1, limit = 20, status }) {
      const skip = (page - 1) * limit;
      const where = {};
      if (status) where.status = status;

      const [data, total] = await Promise.all([
        prisma.newsletterCampaign.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            author: { select: { id: true, name: true, email: true } },
          },
        }),
        prisma.newsletterCampaign.count({ where }),
      ]);

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    },

    async getCampaign(id) {
      const campaign = await prisma.newsletterCampaign.findUnique({
        where: { id },
        include: {
          author: { select: { id: true, name: true, email: true } },
        },
      });

      if (!campaign) {
        throw new AppError('NOT_FOUND', 404, 'Campaign not found');
      }

      return campaign;
    },

    async createCampaign({ subject, bodyMd, scheduledAt, authorId }) {
      return prisma.newsletterCampaign.create({
        data: {
          subject,
          bodyMd,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
          status: scheduledAt ? 'SCHEDULED' : 'DRAFT',
          authorId,
        },
      });
    },

    async updateCampaign(id, { subject, bodyMd, scheduledAt }) {
      const campaign = await prisma.newsletterCampaign.findUnique({ where: { id } });
      if (!campaign) throw new AppError('NOT_FOUND', 404, 'Campaign not found');
      if (campaign.status === 'SENT' || campaign.status === 'SENDING') {
        throw new AppError('BAD_REQUEST', 400, 'Cannot edit a campaign that has already been sent or is sending');
      }

      const data = {};
      if (subject !== undefined) data.subject = subject;
      if (bodyMd !== undefined) data.bodyMd = bodyMd;
      if (scheduledAt !== undefined) {
        data.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
        if (scheduledAt) data.status = 'SCHEDULED';
      }

      return prisma.newsletterCampaign.update({
        where: { id },
        data,
      });
    },

    async sendCampaign(id) {
      const campaign = await prisma.newsletterCampaign.findUnique({ where: { id } });
      if (!campaign) throw new AppError('NOT_FOUND', 404, 'Campaign not found');
      if (campaign.status === 'SENT' || campaign.status === 'SENDING') {
        throw new AppError('BAD_REQUEST', 400, 'Campaign has already been sent or is currently sending');
      }

      // Mark sending
      await prisma.newsletterCampaign.update({
        where: { id },
        data: { status: 'SENDING' },
      });

      // Fetch active subscribers
      const subscribers = await prisma.newsletterSubscriber.findMany({
        where: { status: 'SUBSCRIBED' },
        select: { id: true, email: true, name: true, unsubscribeTokenHash: true },
      });

      const bodyHtml = mdToHtml(campaign.bodyMd);

      // Queue into EmailOutbox
      const outboxEntries = subscribers.map((sub) => ({
        to: sub.email,
        template: 'newsletter_campaign',
        payload: {
          subject: campaign.subject,
          bodyHtml,
          unsubscribeUrl: `${frontendUrl}/newsletter/unsubscribe?token=${sub.unsubscribeTokenHash}`,
        },
      }));

      if (outboxEntries.length > 0) {
        await prisma.emailOutbox.createMany({
          data: outboxEntries,
        });
      }

      // Mark sent
      const updated = await prisma.newsletterCampaign.update({
        where: { id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          sentCount: subscribers.length,
        },
      });

      return {
        campaign: updated,
        recipientsCount: subscribers.length,
      };
    },
  };
}
