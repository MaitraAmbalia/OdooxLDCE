import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../../lib/AppError.js';
import { validate } from '../../middleware/validate.js';
import { requireJson } from '../../middleware/requireJson.js';

const idParams = z.object({ id: z.uuid() });
const money = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const benefits = z.object({ ticketDiscountPct: z.number().min(0).max(100).optional(), merchDiscountPct: z.number().min(0).max(100).optional() });
const tierBody = z.object({ name: z.string().min(2).max(60), pricePaise: money, durationType: z.enum(['ACADEMIC_YEAR', 'SEMESTER']), benefits: benefits.optional() });
const tierPatch = tierBody.partial().extend({ isActive: z.boolean().optional() });
const checkoutBody = z.object({ tierId: z.uuid() });
const verifyBody = z.object({ qr: z.string().max(200), eventId: z.uuid().optional() });
const listQuery = z.object({
  status: z.enum(['PENDING', 'ACTIVE', 'LAPSED', 'CANCELLED']).optional(),
  tierId: z.uuid().optional(),
  expiringWithinDays: z.coerce.number().int().min(1).max(365).optional(),
  page: z.string().optional(), limit: z.string().optional(), // parsed by lib/pagination.js
});

// Mounted at /api/v1. `requirePermission` is B's `authorize` (dev stub until it lands).
// `createPayment` comes from the payments service.
export function createMembershipsRouter({ service, createPayment, authenticate, requirePermission }) {
  const router = Router();

  router.get('/membership-tiers', async (_req, res) => res.json({ data: await service.listTiers() }));
  router.post('/membership-tiers', authenticate, requirePermission('membership.tier.manage'), requireJson, validate({ body: tierBody }), async (req, res) =>
    res.status(201).json({ data: await service.createTier(req.user, req.body, req) }));
  router.patch('/membership-tiers/:id', authenticate, requirePermission('membership.tier.manage'), requireJson, validate({ params: idParams, body: tierPatch }), async (req, res) =>
    res.json({ data: await service.updateTier(req.user, req.params.id, req.body, req) }));

  router.get('/memberships/me', authenticate, async (req, res) => res.json({ data: await service.me(req.user.id) }));
  router.get('/memberships/me/card', authenticate, async (req, res) => res.json({ data: await service.card(req.user.id) }));
  router.post('/memberships/me/card/rotate', authenticate, async (req, res) => res.json({ data: await service.rotate(req.user.id) }));
  router.post('/memberships/checkout', authenticate, requireJson, validate({ body: checkoutBody }), async (req, res) =>
    res.status(201).json({ data: await service.checkout(req.user, req.body, req.get('Idempotency-Key'), createPayment) }));

  // membership.verify, or ticket.checkin (scoped door-staff access arrives with the events module).
  const canVerify = (req, _res, next) =>
    ['membership.verify', 'ticket.checkin'].some((k) => req.user.permissions?.includes(k))
      ? next()
      : next(new AppError('FORBIDDEN', 403, 'You do not have permission to do this'));
  router.post('/memberships/verify', authenticate, canVerify, requireJson, validate({ body: verifyBody }), async (req, res) =>
    res.json({ data: await service.verify(req.body) }));

  router.get('/memberships', authenticate, requirePermission('member.read.any'), validate({ query: listQuery }), async (req, res) =>
    res.json(await service.list(req.validated.query)));
  router.get('/memberships/stats', authenticate, requirePermission('member.stats.read'), async (_req, res) => res.json({ data: await service.stats() }));

  return router;
}
