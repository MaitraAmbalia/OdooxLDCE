import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { periodSchema } from '../../lib/period.js';

const category = z.enum(['DUES', 'TICKETS', 'MERCH', 'FUNDRAISER', 'BUDGET_ALLOCATION', 'SPONSORSHIP', 'REIMBURSEMENT', 'PURCHASE', 'REFUND', 'OTHER']);
const direction = z.enum(['IN', 'OUT']);
const paise = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);

const idParams = z.object({ id: z.guid() });
const listQuery = z.object({
  from: z.coerce.date().optional(), to: z.coerce.date().optional(),
  direction: direction.optional(), category: category.optional(),
  type: z.string().optional(),
  sourceType: z.enum(['PAYMENT', 'CASH_COLLECTION', 'CLAIM', 'ALLOCATION', 'MANUAL', 'REVERSAL', 'REFUND']).optional(),
  eventId: z.guid().optional(), projectId: z.guid().optional(),
  page: z.string().optional(), limit: z.string().optional(), sort: z.string().optional(), // parsed by lib/pagination.js
});
const manualBody = z.object({
  direction, category, amountPaise: paise, description: z.string().min(3).max(500),
  occurredAt: z.coerce.date(), eventId: z.guid().optional(), projectId: z.guid().optional(),
  attachmentFileId: z.guid().optional(), // a LEDGER_ATTACHMENT file the caller uploaded
});
const reverseBody = z.object({ reason: z.string().min(3).max(500) });
const allocationBody = z.object({ period: periodSchema, amountPaise: paise, source: z.enum(['UNIVERSITY_GRANT', 'CARRY_FORWARD', 'OTHER']), note: z.string().max(500).optional() });
const claimBody = z.object({
  amountPaise: paise, description: z.string().trim().min(3).max(500),
  category: z.enum(['REIMBURSEMENT', 'PURCHASE', 'OTHER']).default('REIMBURSEMENT'),
  // +1 day: a date-only value is UTC midnight, which is "tomorrow" for part of the day in IST.
  dateSpent: z.coerce.date().refine((d) => d.getTime() <= Date.now() + 864e5, 'The spend date cannot be in the future'),
  eventId: z.guid().optional(), projectId: z.guid().optional(), taskId: z.guid().optional(),
  receiptFileIds: z.array(z.guid()).max(5).optional(),
}).refine((c) => c.eventId || c.projectId || c.taskId, { message: 'Link the claim to an event, project or task', path: ['eventId'] });
const reviewBody = z.object({ decision: z.enum(['APPROVE', 'REJECT']), reason: z.string().max(500).optional() });
const payBody = z.object({ method: z.enum(['UPI', 'BANK_TRANSFER', 'CASH']), reference: z.string().trim().min(3).max(100) });
const cashBody = z.object({ purpose: z.enum(['MEMBERSHIP', 'TICKET', 'FUNDRAISER', 'MERCH']), amountPaise: paise, payerUserId: z.guid().optional(), refId: z.guid().optional() });
const cashRejectBody = z.object({ reason: z.string().trim().min(3).max(300) });
const limitsBody = z.object({
  period: periodSchema,
  limits: z.array(z.object({ category, limitPaise: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER) })).min(1).max(20),
});

// Mounted at /api/v1. `requirePermission` is B's `authorize` (dev stub until it lands).
export function createFinanceRouter({ service, authenticate, requirePermission }) {
  const router = Router();
  const can = (key) => [authenticate, requirePermission(key)];

  // ---- ledger (/balance and /manual are declared before /:id)
  router.get('/ledger', ...can('ledger.read'), validate({ query: listQuery }), async (req, res) => res.json(await service.list(req.query)));
  router.get('/finance/ledger', ...can('ledger.read'), validate({ query: listQuery }), async (req, res) => res.json(await service.list(req.query)));
  router.get('/ledger/balance', ...can('ledger.read'), async (_req, res) => res.json({ data: await service.balance() }));
  router.get('/finance/balance', ...can('ledger.read'), async (_req, res) => res.json({ data: await service.balance() }));
  router.post('/ledger/manual', ...can('ledger.write'), validate({ body: manualBody }), async (req, res) =>
    res.status(201).json({ data: await service.createManual(req.user, req.body, req) }));
  router.get('/ledger/:id', ...can('ledger.read'), validate({ params: idParams }), async (req, res) => res.json({ data: await service.get(req.params.id) }));
  router.post('/ledger/:id/reverse', ...can('ledger.write'), validate({ params: idParams, body: reverseBody }), async (req, res) =>
    res.status(201).json({ data: await service.reverse(req.user, req.params.id, req.body, req) }));

  // ---- budgets
  router.post('/budgets/allocations', ...can('budget.allocate'), validate({ body: allocationBody }), async (req, res) =>
    res.status(201).json({ data: await service.allocate(req.user, req.body, req) }));
  router.get('/budgets/allocations', ...can('ledger.read'), validate({ query: z.object({ period: periodSchema.optional() }) }), async (req, res) =>
    res.json({ data: await service.listAllocations(req.query.period) }));
  router.put('/budgets/limits', ...can('budget.limit.manage'), validate({ body: limitsBody }), async (req, res) =>
    res.json({ data: await service.setLimits(req.user, req.body, req) }));
  router.get('/budgets/utilization', ...can('ledger.read'), validate({ query: z.object({ period: periodSchema }) }), async (req, res) =>
    res.json({ data: await service.utilization(req.query.period) }));
  router.get('/finance/budget', ...can('ledger.read'), async (_req, res) => res.json({ data: await service.budgetOverview() }));

  // ---- reports and reconciliation
  router.get('/finance/reports', ...can('finance.report.read'), async (req, res) =>
    res.json({ data: await service.reportSummary(req.query.type) }));
  router.get('/finance/payments', ...can('ledger.read'), async (req, res) => res.json(await service.listPayments(req.query)));

  // ---- cash collections (collected at the cash desk, verified by the Treasurer)
  // Verifiers see every collection; a desk operator sees only their own.
  router.get('/cash-collections', authenticate, async (req, res) =>
    res.json(await service.listCashCollections(req.query.status, req.query, req.user.permissions?.includes('cash.verify') ? null : req.user.id)));
  router.post('/cash-collections', authenticate, validate({ body: cashBody }), async (req, res) =>
    res.status(201).json({ data: await service.createCashCollection(req.user, req.body) }));
  router.patch('/cash-collections/:id/verify', ...can('cash.verify'), validate({ params: idParams }), async (req, res) =>
    res.json({ data: await service.resolveCashCollection(req.user, req.params.id, { approve: true }, req) }));
  router.patch('/cash-collections/:id/reject', ...can('cash.verify'), validate({ params: idParams, body: cashRejectBody }), async (req, res) =>
    res.json({ data: await service.resolveCashCollection(req.user, req.params.id, { approve: false, reason: req.body.reason }, req) }));

  // ---- expense claims
  const claimReviewer = requirePermission('claim.review', 'claim.review.high', 'claim.review.treasurer', 'claim.pay');
  router.get('/claims/me', authenticate, async (req, res) =>
    res.json(await service.listClaims(req.user, { ...req.query, mine: true })));
  router.get('/claims', authenticate, claimReviewer, async (req, res) =>
    res.json(await service.listClaims(req.user, req.query)));
  router.get('/claims/:id', authenticate, validate({ params: idParams }), async (req, res) =>
    res.json({ data: await service.getClaim(req.user, req.params.id) }));
  router.post('/claims', ...can('claim.submit'), validate({ body: claimBody }), async (req, res) =>
    res.status(201).json({ data: await service.submitClaim(req.user, req.body) }));
  router.post('/claims/:id/review', authenticate, claimReviewer, validate({ params: idParams, body: reviewBody }), async (req, res) =>
    res.json({ data: await service.reviewClaim(req.user, req.params.id, req.body, req) }));
  router.post('/claims/:id/pay', ...can('claim.pay'), validate({ params: idParams, body: payBody }), async (req, res) =>
    res.json({ data: await service.payClaim(req.user, req.params.id, req.body, req) }));

  return router;
}
