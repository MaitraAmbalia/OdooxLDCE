import { z } from 'zod';

const uuidSchema = z.string().regex(
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
  'Invalid UUID',
);

export const eventParamsSchema = z.object({ eventId: uuidSchema });

export const opportunityParamsSchema = z.object({
  eventId: uuidSchema,
  odooLeadId: z.coerce.number().int().positive(),
});

export const createOpportunitySchema = z.object({
  companyName: z.string().trim().min(2).max(160),
  contactName: z.string().trim().min(2).max(160),
  email: z.email().max(254),
  phone: z.string().trim().min(5).max(30).optional().or(z.literal('')),
  packageName: z.string().trim().min(2).max(120),
  expectedAmountPaise: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  note: z.string().trim().max(1000).optional().or(z.literal('')),
});

export const receiptSchema = z.object({
  amountReceivedPaise: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  receivedAt: z.coerce.date(),
  paymentReference: z.string().trim().min(3).max(120),
  note: z.string().trim().max(500).optional().or(z.literal('')),
});
