import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { requireJson } from '../../middleware/requireJson.js';

const idParams = z.object({ id: z.uuid() });
// Values come from Razorpay checkout's success callback.
const confirmBody = z.object({ gatewayPaymentId: z.string().min(1).max(100), gatewaySignature: z.string().min(1).max(200) });

// Express 5 forwards rejected promises to the error handler, so handlers need no try/catch.
export function createPaymentsRouter({ service, authenticate, config }) {
  const router = Router();

  // Auth = the gateway signature (checked in the service), not a user session.
  // Always 200 once the signature is valid so the gateway stops retrying; real crashes surface as 500 and are retried.
  router.post('/webhook', async (req, res) => {
    const result = await service.handleWebhook(req.body, req.get('X-Razorpay-Signature'));
    req.log?.info({ result }, 'payment webhook processed');
    res.json({ data: { received: true } });
  });

  router.get('/:id', authenticate, validate({ params: idParams }), async (req, res) =>
    res.json({ data: await service.get(req.user.id, req.params.id) }));

  router.post('/:id/confirm', authenticate, requireJson, validate({ params: idParams, body: confirmBody }), async (req, res) =>
    res.json({ data: await service.confirm(req.user.id, req.params.id, req.body) }));

  // Dev shortcut: not registered at all in production, so it is a plain 404 there.
  if (!config.isProduction) {
    router.post('/:id/mock-complete', authenticate, validate({ params: idParams }), async (req, res) =>
      res.json({ data: await service.mockComplete(req.user.id, req.params.id) }));
  }

  return router;
}
