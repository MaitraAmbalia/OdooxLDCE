import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { requireJson } from '../../middleware/requireJson.js';
import { createPaymentsController } from './payments.controller.js';
import { confirmBody, paymentIdParams } from './payments.schemas.js';

// Express 5 forwards rejected promises to the error handler, so no try/catch wrappers needed.
export function createPaymentsRouter({ service, authenticate, config }) {
  const router = Router();
  const c = createPaymentsController(service);

  // Auth = gateway signature (checked in the service), NOT a user session. Raw body is set up in app.js.
  router.post('/webhook', c.webhook);

  router.get('/:id', authenticate, validate({ params: paymentIdParams }), c.get);
  router.post('/:id/confirm', authenticate, requireJson, validate({ params: paymentIdParams, body: confirmBody }), c.confirm);

  // Demo-only: not registered at all in production, so it is a plain 404 there.
  if (!config.isProduction) {
    router.post('/:id/mock-complete', authenticate, validate({ params: paymentIdParams }), c.mockComplete);
  }

  return router;
}
