import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../../lib/AppError.js';
import { validate } from '../../middleware/validate.js';
import { EVENT_LEADS } from './events.service.js';

const paise = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
const ticketType = z.object({
  name: z.string().trim().min(1).max(80),
  audience: z.enum(['ALL', 'MEMBER', 'NON_MEMBER']).default('ALL'),
  pricePaise: paise,
  quota: z.number().int().positive(),
  maxPerUser: z.number().int().min(1).max(10).default(5),
});
const budgetLine = z.object({ category: z.string().trim().min(1).max(60), amountPaise: paise.positive(), note: z.string().max(300).optional() });
const eventShape = {
  title: z.string().trim().min(3).max(150),
  description: z.string().trim().min(10).max(10000),
  category: z.string().trim().max(40).optional(),
  venue: z.string().trim().min(2).max(200),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  capacity: z.number().int().positive().max(100000),
  visibility: z.enum(['PUBLIC', 'MEMBERS_ONLY']).optional(),
  ticketTypes: z.array(ticketType).min(1).max(10),
  budgetLines: z.array(budgetLine).max(30).optional(),
};
const quotasFit = (e) => !e.ticketTypes || !e.capacity || e.ticketTypes.every((t) => t.quota <= e.capacity);
const createBody = z.object(eventShape)
  .refine((e) => e.startAt < e.endAt, { message: 'End time must be after the start time', path: ['endAt'] })
  .refine((e) => e.startAt > new Date(), { message: 'The event must start in the future', path: ['startAt'] })
  .refine(quotasFit, { message: 'A ticket quota cannot exceed the event capacity', path: ['ticketTypes'] });
const updateBody = z.object(eventShape).partial().refine(quotasFit, { message: 'A ticket quota cannot exceed the event capacity', path: ['ticketTypes'] });
const idParams = z.object({ id: z.guid() });
const staffParams = z.object({ id: z.guid(), userId: z.guid() });

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

  // GET /events/manage - Event console: every status (leaders), or the caller's own proposals.
  router.get('/events/manage', authenticate, async (req, res) => {
    res.json({ data: await service.listManaged(req.user) });
  });

  // GET /events/door-duties/me - Upcoming events the caller staffs the door for
  router.get('/events/door-duties/me', authenticate, async (req, res) => {
    res.json({ data: await service.myDoorDuties(req.user.id) });
  });

  // GET /events/:id - Get event details
  router.get('/events/:id', optionalAuth, validate({ params: idParams }), async (req, res) => {
    res.json({ data: await service.getById(req.params.id, req.user) });
  });

  // GET /events/:id/ticket-types - Get ticket types for an event
  router.get('/events/:id/ticket-types', optionalAuth, validate({ params: idParams }), async (req, res) => {
    const event = await service.getById(req.params.id, req.user);
    res.json({ data: event.ticketTypes ?? [] });
  });

  // POST /events - Create event (Event Head / Leaders)
  router.post('/events', authenticate, authorize('event.propose'), validate({ body: createBody }), async (req, res) => {
    res.status(201).json({ data: await service.create(req.user.sub, req.body) });
  });

  // PATCH /events/:id - Edit/resubmit a proposal, or adjust a live event's logistics
  router.patch('/events/:id', authenticate, authorize('event.propose'), validate({ params: idParams, body: updateBody }), async (req, res) => {
    res.json({ data: await service.update(req.user, req.params.id, req.body) });
  });

  // POST /events/:id/review - Mentor review decision
  router.post('/events/:id/review', authenticate, authorize('event.approve'), validate({ params: idParams }), async (req, res) => {
    res.json({ data: await service.reviewProposal(req.params.id, req.user.sub, req.body) });
  });

  // GET /events/:id/report - Tickets sold vs door check-ins, revenue, budget use
  router.get('/events/:id/report', authenticate, authorize('event.report.read'), validate({ params: idParams }), async (req, res) => {
    res.json({ data: await service.report(req.params.id) });
  });

  // Door staff (temporary check-in access for one event)
  router.get('/events/:id/door-staff', authenticate, authorize('event.door.assign'), validate({ params: idParams }), async (req, res) => {
    res.json({ data: await service.listDoorStaff(req.params.id) });
  });
  router.post('/events/:id/door-staff', authenticate, authorize('event.door.assign'), validate({ params: idParams, body: z.object({ userId: z.guid() }) }), async (req, res) => {
    res.status(201).json({ data: await service.addDoorStaff(req.user.id, req.params.id, req.body.userId) });
  });
  router.delete('/events/:id/door-staff/:userId', authenticate, authorize('event.door.assign'), validate({ params: staffParams }), async (req, res) => {
    res.json({ data: await service.removeDoorStaff(req.params.id, req.params.userId) });
  });

  return router;
}
