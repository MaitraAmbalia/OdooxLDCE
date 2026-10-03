import { z } from 'zod';

export const generalSettings = {
  'club.name': z.string().trim().min(1).max(80),
  'club.academicYearEnd': z.string().regex(/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/),
  'merch.nonMemberPurchase': z.boolean(),
  'membership.renewalWindowDays': z.number().int().min(1).max(365),
  'membership.reminderDays': z.array(z.number().int().min(1).max(365)).max(12),
};
export const policySettings = {
  'claims.highValueThresholdPaise': z.number().int().min(1).max(Number.MAX_SAFE_INTEGER),
  'claims.maxAgeDays': z.number().int().min(1).max(365),
  'events.reapprovalBudgetPct': z.number().int().min(0).max(100),
  'events.largeEventCapacity': z.number().int().min(1).max(100000),
  'tickets.reservationMinutes': z.number().int().min(1).max(60),
  'orders.reservationMinutes': z.number().int().min(1).max(60),
};
export const defaults = { 'club.name': 'Skyline Student Association', 'club.academicYearEnd': '05-31',
  'merch.nonMemberPurchase': false, 'membership.renewalWindowDays': 30, 'membership.reminderDays': [30, 7],
  'claims.highValueThresholdPaise': 200000, 'claims.maxAgeDays': 30, 'events.reapprovalBudgetPct': 10,
  'events.largeEventCapacity': 200, 'tickets.reservationMinutes': 10, 'orders.reservationMinutes': 15 };
export const settingsBody = (shape) => z.object({ values: z.object(shape).partial().strict()
  .refine((value) => Object.keys(value).length > 0) });
