import { Router } from 'express';

export function createEventsRouter({ service, authenticate, authorize }) {
  const router = Router();

  // GET /events - List published events (Public)
  router.get('/events', async (req, res) => {
    res.json({ data: await service.list(req.query) });
  });

  // GET /events/:id - Get event details
  router.get('/events/:id', async (req, res) => {
    res.json({ data: await service.getById(req.params.id) });
  });

  // GET /events/:id/ticket-types - Get ticket types for an event
  router.get('/events/:id/ticket-types', async (req, res) => {
    const event = await service.getById(req.params.id);
    res.json({ data: event.ticketTypes ?? [] });
  });

  // POST /events - Create event (Event Head / Leaders)
  router.post('/events', authenticate, async (req, res) => {
    res.status(201).json({ data: await service.create(req.user.sub, req.body) });
  });

  // POST /events/:id/review - Mentor review decision
  router.post('/events/:id/review', authenticate, async (req, res) => {
    res.json({ data: await service.reviewProposal(req.params.id, req.user.sub, req.body) });
  });

  return router;
}
