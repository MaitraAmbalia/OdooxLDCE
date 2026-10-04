import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import {
  subscribeSchema,
  createCampaignSchema,
  updateCampaignSchema,
  listSubscribersQuerySchema,
  listCampaignsQuerySchema,
} from './newsletter.schemas.js';

export function createNewsletterRouter({ service, authenticate, authorize }) {
  const router = Router();

  router.get('/newsletter/preferences/me', authenticate, async (req, res, next) => {
    try {
      res.json({ data: await service.getProfilePreference({ userId: req.user.id }) });
    } catch (err) {
      next(err);
    }
  });

  router.patch('/newsletter/preferences/me', authenticate, async (req, res, next) => {
    try {
      if (typeof req.body.enabled !== 'boolean') return res.status(400).json({ error: { message: 'enabled must be a boolean' } });
      const result = await service.setProfilePreference({
        userId: req.user.id,
        name: req.user.name,
        enabled: req.body.enabled,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  });

  // 1. Public Subscription Endpoints
  router.post('/newsletter/subscribe', validate({ body: subscribeSchema }), async (req, res, next) => {
    try {
      const result = await service.subscribe({
        email: req.body.email,
        name: req.body.name,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  });

  router.all(['/newsletter/confirm', '/newsletter/confirm/:token'], async (req, res, next) => {
    try {
      const token = req.params.token || req.query.token || req.body?.token;
      if (!token) {
        return res.status(400).json({ error: { message: 'Token is required' } });
      }
      const result = await service.confirmSubscription({
        token,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  });

  router.all(['/newsletter/unsubscribe', '/newsletter/unsubscribe/:token'], async (req, res, next) => {
    try {
      const token = req.params.token || req.query.token || req.body?.token;
      if (!token) {
        return res.status(400).json({ error: { message: 'Token is required' } });
      }
      const result = await service.unsubscribe({
        token,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  });

  // 2. Protected Management Endpoints
  router.get(
    '/newsletter/subscribers/stats',
    authenticate,
    authorize ? authorize(['newsletter.stats.read', 'newsletter.send']) : (req, res, next) => next(),
    async (req, res, next) => {
      try {
        const stats = await service.getSubscribersStats();
        res.json({ data: stats });
      } catch (err) {
        next(err);
      }
    }
  );

  router.get(
    '/newsletter/subscribers',
    authenticate,
    authorize ? authorize(['newsletter.stats.read', 'newsletter.send']) : (req, res, next) => next(),
    validate({ query: listSubscribersQuerySchema }),
    async (req, res, next) => {
      try {
        const result = await service.listSubscribers(req.query);
        res.json(result);
      } catch (err) {
        next(err);
      }
    }
  );

  router.get(
    '/newsletter/campaigns',
    authenticate,
    authorize ? authorize(['newsletter.stats.read', 'newsletter.send']) : (req, res, next) => next(),
    validate({ query: listCampaignsQuerySchema }),
    async (req, res, next) => {
      try {
        const result = await service.listCampaigns(req.query);
        res.json(result);
      } catch (err) {
        next(err);
      }
    }
  );

  router.get(
    '/newsletter/campaigns/:id',
    authenticate,
    authorize ? authorize(['newsletter.stats.read', 'newsletter.send']) : (req, res, next) => next(),
    async (req, res, next) => {
      try {
        const campaign = await service.getCampaign(req.params.id);
        res.json({ data: campaign });
      } catch (err) {
        next(err);
      }
    }
  );

  router.post(
    '/newsletter/campaigns',
    authenticate,
    authorize ? authorize(['newsletter.send']) : (req, res, next) => next(),
    validate({ body: createCampaignSchema }),
    async (req, res, next) => {
      try {
        const campaign = await service.createCampaign({
          ...req.body,
          authorId: req.user.id,
        });
        res.status(201).json({ data: campaign });
      } catch (err) {
        next(err);
      }
    }
  );

  router.patch(
    '/newsletter/campaigns/:id',
    authenticate,
    authorize ? authorize(['newsletter.send']) : (req, res, next) => next(),
    validate({ body: updateCampaignSchema }),
    async (req, res, next) => {
      try {
        const campaign = await service.updateCampaign(req.params.id, req.body);
        res.json({ data: campaign });
      } catch (err) {
        next(err);
      }
    }
  );

  router.post(
    '/newsletter/campaigns/:id/send',
    authenticate,
    authorize ? authorize(['newsletter.send']) : (req, res, next) => next(),
    async (req, res, next) => {
      try {
        const result = await service.sendCampaign(req.params.id);
        res.json({ data: result });
      } catch (err) {
        next(err);
      }
    }
  );

  return router;
}
