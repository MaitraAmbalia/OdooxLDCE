import { Router } from 'express';
import { AppError } from '../../lib/AppError.js';
import { EVENT_LEADS } from './events.service.js';

export function createEventsRouter({ service, authenticate, authorize }) {
  const router = Router();
  // Identify the viewer when a session exists, but never require one.
  const optionalAuth = (req, res, next) => authenticate(req, res, () => next());

  // GET /events - List published events (Public)
  // Listing anything other than published events (e.g. proposals) is for event leaders only.
  router.get('/events', optionalAuth, async (req, res) => {
    const wantsUnpublished = req.query.status && req.query.status !== 'PUBLISHED';
    if (wantsUnpublished && !EVENT_LEADS.some((p) => req.user?.permissions?.includes(p))) {
      throw new AppError('FORBIDDEN', 403, 'Permission is required');
    }
    res.json(await service.list(req.query));
  });

  // GET /events/:id - Get event details
  router.get('/events/:id', optionalAuth, async (req, res) => {
    res.json({ data: await service.getById(req.params.id, req.user) });
  });

  // GET /events/:id/ticket-types - Get ticket types for an event
  router.get('/events/:id/ticket-types', optionalAuth, async (req, res) => {
    const event = await service.getById(req.params.id, req.user);
    res.json({ data: event.ticketTypes ?? [] });
  });

  // POST /events - Create event (Event Head / Leaders)
  router.post('/events', authenticate, authorize('event.propose'), async (req, res) => {
    res.status(201).json({ data: await service.create(req.user.sub, req.body) });
  });

  // POST /events/:id/review - Mentor review decision
  router.post('/events/:id/review', authenticate, authorize('event.approve'), async (req, res) => {
    res.json({ data: await service.reviewProposal(req.params.id, req.user.sub, req.body) });
  });

  return router;
}
