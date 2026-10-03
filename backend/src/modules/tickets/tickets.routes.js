import { Router } from 'express';
import { getIO } from '../../lib/socket.js';

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

  // GET /tickets/event/:eventId/attendance - Live Attendance List and counts
  router.get('/tickets/event/:eventId/attendance', authenticate, async (req, res) => {
    res.json({ data: await service.getEventAttendance(req.user, req.params.eventId) });
  });

  // GET /tickets/:id - Single ticket details
  router.get('/tickets/:id', authenticate, async (req, res) => {
    res.json({ data: await service.getTicketById(req.user.sub, req.params.id) });
  });

  // POST /tickets/checkin - Fast Door Check-in (Volunteer / Staff), body { qr, eventId }
  router.post('/tickets/checkin', authenticate, async (req, res) => {
    const result = await service.checkIn(req.user, req.body.qr, req.body.eventId);
    const io = getIO();
    if (io && result.eventId) {
      io.to(`event:${result.eventId}`).emit('checkin:attended', {
        attendee: {
          ticketId: result.ticketId,
          name: result.attendeeName,
          studentId: result.studentId,
          ticketType: result.ticketType,
          checkedInAt: result.checkedInAt,
        },
        totalCheckedIn: result.totalCheckedIn,
        totalIssued: result.totalIssued,
      });
    }
    res.json({ data: result });
  });

  return router;
}
