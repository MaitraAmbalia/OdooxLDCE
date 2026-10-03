import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { requireJson } from '../../middleware/requireJson.js';
import { periodSchema } from '../../lib/period.js';

const category = z.enum(['DUES', 'TICKETS', 'MERCH', 'FUNDRAISER', 'BUDGET_ALLOCATION', 'SPONSORSHIP', 'REIMBURSEMENT', 'PURCHASE', 'REFUND', 'OTHER']);
const direction = z.enum(['IN', 'OUT']);
const paise = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);

const idParams = z.object({ id: z.uuid() });
const listQuery = z.object({
  from: z.coerce.date().optional(), to: z.coerce.date().optional(),
  direction: direction.optional(), category: category.optional(),
  sourceType: z.enum(['PAYMENT', 'CASH_COLLECTION', 'CLAIM', 'ALLOCATION', 'MANUAL', 'REVERSAL', 'REFUND']).optional(),
  eventId: z.uuid().optional(), projectId: z.uuid().optional(),
  page: z.string().optional(), limit: z.string().optional(), sort: z.string().optional(), // parsed by lib/pagination.js
});
const manualBody = z.object({
  direction, category, amountPaise: paise, description: z.string().min(3).max(500),
  occurredAt: z.coerce.date(), eventId: z.uuid().optional(), projectId: z.uuid().optional(),
});
const reverseBody = z.object({ reason: z.string().min(3).max(500) });
const allocationBody = z.object({ period: periodSchema, amountPaise: paise, source: z.enum(['UNIVERSITY_GRANT', 'CARRY_FORWARD', 'OTHER']), note: z.string().max(500).optional() });
const limitsBody = z.object({
  period: periodSchema,
  limits: z.array(z.object({ category, limitPaise: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER) })).min(1).max(20),
});

// Mounted at /api/v1. `requirePermission` is B's `authorize` (dev stub until it lands).
export function createFinanceRouter({ service, authenticate, requirePermission }) {
  const router = Router();
  const can = (key) => [authenticate, requirePermission(key)];
  const json = [requireJson];

  // ---- ledger (/balance and /manual are declared before /:id)
  router.get('/ledger', ...can('ledger.read'), validate({ query: listQuery }), async (req, res) => res.json(await service.list(req.validated.query)));
  router.get('/ledger/balance', ...can('ledger.read'), async (_req, res) => res.json({ data: await service.balance() }));
  router.post('/ledger/manual', ...can('ledger.write'), ...json, validate({ body: manualBody }), async (req, res) =>
    res.status(201).json({ data: await service.createManual(req.user, req.body, req) }));
  router.get('/ledger/:id', ...can('ledger.read'), validate({ params: idParams }), async (req, res) => res.json({ data: await service.get(req.params.id) }));
  router.post('/ledger/:id/reverse', ...can('ledger.write'), ...json, validate({ params: idParams, body: reverseBody }), async (req, res) =>
    res.status(201).json({ data: await service.reverse(req.user, req.params.id, req.body, req) }));

  // ---- budgets
  router.post('/budgets/allocations', ...can('budget.allocate'), ...json, validate({ body: allocationBody }), async (req, res) =>
    res.status(201).json({ data: await service.allocate(req.user, req.body, req) }));
  router.get('/budgets/allocations', ...can('ledger.read'), validate({ query: z.object({ period: periodSchema.optional() }) }), async (req, res) =>
    res.json({ data: await service.listAllocations(req.validated.query.period) }));
  router.put('/budgets/limits', ...can('budget.limit.manage'), ...json, validate({ body: limitsBody }), async (req, res) =>
    res.json({ data: await service.setLimits(req.user, req.body, req) }));
  router.get('/budgets/utilization', ...can('ledger.read'), validate({ query: z.object({ period: periodSchema }) }), async (req, res) =>
    res.json({ data: await service.utilization(req.validated.query.period) }));

  return router;
}
