import { Router } from 'express';

export function createTicketsRouter({ service, authenticate, authorize }) {
  const router = Router();

  // POST /tickets/buy - Purchase/Issue ticket
  router.post('/tickets/buy', authenticate, async (req, res) => {
    res.status(201).json({ data: await service.buyTicket(req.user.sub, req.body) });
  });

  // GET /tickets/me - My tickets
  router.get('/tickets/me', authenticate, async (req, res) => {
    res.json(await service.getUserTickets(req.user.sub, req.query));
  });

  // GET /tickets/:id - Single ticket details
  router.get('/tickets/:id', async (req, res) => {
    res.json({ data: await service.getTicketById(req.params.id) });
  });

  // POST /tickets/:id/checkin - Fast Door Check-in (Volunteer / Staff)
  router.post('/tickets/:id/checkin', authenticate, async (req, res) => {
    res.json({ data: await service.checkIn(req.user.sub, req.params.id) });
  });

  return router;
}
