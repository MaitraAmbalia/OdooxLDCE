import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { createOpportunitySchema, eventParamsSchema, opportunityParamsSchema, receiptSchema } from './odoo.schemas.js';

export function createOdooRouter({ service, authenticate, authorize }) {
  const router = Router();
  const canRead = authorize('sponsorship.crm.read', 'sponsorship.crm.manage', 'sponsorship.receipt.record');

  router.get('/integrations/odoo/health', authenticate, canRead, async (_req, res) => {
    res.json({ data: await service.health() });
  });

  router.get('/sponsorship/events', authenticate, canRead, async (_req, res) => {
    res.json({ data: await service.listReadyEvents() });
  });

  router.post(
    '/events/:eventId/odoo-opportunities',
    authenticate,
    authorize('sponsorship.crm.manage'),
    validate({ params: eventParamsSchema, body: createOpportunitySchema }),
    async (req, res) => {
      res.status(201).json({ data: await service.createOpportunity(req.params.eventId, req.body) });
    },
  );

  router.get(
    '/events/:eventId/odoo-sponsorship-summary',
    authenticate,
    canRead,
    validate({ params: eventParamsSchema }),
    async (req, res) => {
      res.json({ data: await service.summary(req.params.eventId) });
    },
  );

  router.post(
    '/events/:eventId/odoo-opportunities/:odooLeadId/receipts',
    authenticate,
    authorize('sponsorship.receipt.record'),
    validate({ params: opportunityParamsSchema, body: receiptSchema }),
    async (req, res) => {
      const result = await service.recordReceipt(req.params.eventId, req.params.odooLeadId, req.body, req.user, req);
      res.status(result.duplicate ? 200 : 201).json({ data: result });
    },
  );

  return router;
}
