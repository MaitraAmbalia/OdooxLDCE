import { Router } from 'express';

export function createTicketsRouter({ service, authenticate, authorize }) {
  const router = Router();

  // POST /tickets/buy - Purchase/Issue ticket
  router.post('/tickets/buy', authenticate, async (req, res) => {
    res.status(201).json({ data: await service.buyTicket(req.user.sub, req.body, req.get('Idempotency-Key')) });
  });

  // GET /tickets/me - My tickets
  router.get('/tickets/me', authenticate, async (req, res) => {
    res.json(await service.getUserTickets(req.user.sub, req.query));
  });

  // GET /tickets/:id - Single ticket details
  router.get('/tickets/:id', authenticate, async (req, res) => {
    res.json({ data: await service.getTicketById(req.user.sub, req.params.id) });
  });

  // POST /tickets/checkin - Fast Door Check-in (Volunteer / Staff), body { qr, eventId }
  router.post('/tickets/checkin', authenticate, async (req, res) => {
    res.json({ data: await service.checkIn(req.user, req.body.qr, req.body.eventId) });
  });

  return router;
}
