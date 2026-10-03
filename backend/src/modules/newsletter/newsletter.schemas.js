import { z } from 'zod';

export const subscribeSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).default('Subscriber'),
});

export const createCampaignSchema = z.object({
  subject: z.string().min(3).max(255),
  bodyMd: z.string().min(10),
  scheduledAt: z.string().datetime().optional().nullable(),
});

export const updateCampaignSchema = z.object({
  subject: z.string().min(3).max(255).optional(),
  bodyMd: z.string().min(10).optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
});

export const listSubscribersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['PENDING_CONFIRMATION', 'SUBSCRIBED', 'UNSUBSCRIBED']).optional(),
  search: z.string().optional(),
});

export const listCampaignsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['DRAFT', 'SCHEDULED', 'SENDING', 'SENT']).optional(),
});
