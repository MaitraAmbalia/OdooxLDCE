import { Router } from 'express';
import { parsePagination, createPageMeta } from '../../lib/pagination.js';

export function createNotificationsRouter({ service, authenticate, authorize, prisma }) {
  const router = Router();

  // 1. In-App Notifications
  router.get('/notifications', authenticate, async (req, res) => {
    res.json(await service.listUserNotifications(req.user.sub, req.query));
  });

  router.patch('/notifications/:id/read', authenticate, async (req, res) => {
    res.json({ data: await service.markRead(req.user.sub, req.params.id) });
  });

  router.post('/notifications/read-all', authenticate, async (req, res) => {
    res.json({ data: await service.markAllRead(req.user.sub) });
  });

  // 2. Announcements Feed (Fully Database Driven)
  router.get('/announcements', async (req, res) => {
    try {
      const page = parsePagination(req.query, { defaultLimit: 20 });
      const where = { status: 'PUBLISHED' };

      const [announcements, total] = await Promise.all([
        prisma.announcement.findMany({
          where,
          orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
          skip: page.skip,
          take: page.take,
          include: {
            corrections: true,
            author: { select: { id: true, name: true } },
          },
        }),
        prisma.announcement.count({ where }),
      ]);

      return res.json({
        data: announcements.map((a) => ({
          ...a,
          body: a.bodyMd,
        })),
        meta: createPageMeta(page, total),
      });
    } catch (e) {
      return res.status(500).json({ error: { message: 'Failed to fetch announcements' } });
    }
  });

  router.get('/announcements/:id', async (req, res) => {
    try {
      const a = await prisma.announcement.findUnique({
        where: { id: req.params.id },
        include: {
          corrections: true,
          author: { select: { id: true, name: true } },
        },
      });

      if (!a) {
        return res.status(404).json({ error: { message: 'Announcement not found' } });
      }

      return res.json({
        data: {
          ...a,
          body: a.bodyMd,
        },
      });
    } catch (e) {
      return res.status(500).json({ error: { message: 'Failed to retrieve announcement' } });
    }
  });

  router.post('/announcements', authenticate, authorize('announcement.publish'), async (req, res) => {
    try {
      const { title, body, audience = 'PUBLIC' } = req.body;
      if (!title || !body) {
        return res.status(400).json({ error: { message: 'Title and body are required' } });
      }

      const created = await prisma.announcement.create({
        data: {
          title,
          bodyMd: body,
          audience: audience === 'MEMBERS' ? 'MEMBERS' : 'PUBLIC',
          authorId: req.user.sub,
          status: 'PUBLISHED',
          publishedAt: new Date(),
        },
        include: {
          author: { select: { id: true, name: true } },
        },
      });

      return res.status(201).json({
        data: {
          ...created,
          body: created.bodyMd,
        },
      });
    } catch (e) {
      return res.status(500).json({ error: { message: 'Failed to create announcement' } });
    }
  });

  // 3. Dynamic Executive Dashboard Aggregate Counts
  router.get('/dashboard/counts', authenticate, async (req, res) => {
    try {
      const [claimsCount, tasksCount, proposalsCount, ordersCount, cash, duesPending, myProposals] = await Promise.all([
        prisma.expenseClaim.count({ where: { status: { in: ['SUBMITTED', 'APPROVED_L1', 'APPROVED'] } } }),
        prisma.task.count({ where: { status: { in: ['TODO', 'IN_PROGRESS'] } } }),
        prisma.event.count({ where: { status: 'PENDING_APPROVAL' } }),
        prisma.order.count({ where: { status: 'PAID' } }),
        prisma.cashCollection.aggregate({ where: { status: 'PENDING_VERIFICATION' }, _count: { _all: true }, _sum: { amountPaise: true } }),
        prisma.membership.count({ where: { status: 'PENDING' } }),
        prisma.event.groupBy({ by: ['status'], where: { proposedById: req.user.id, status: { in: ['PENDING_APPROVAL', 'CHANGES_REQUESTED'] } }, _count: { _all: true } }),
      ]);
      const mine = (status) => myProposals.find((g) => g.status === status)?._count._all ?? 0;

      return res.json({
        data: {
          claimsPending: claimsCount,
          ordersToPack: ordersCount,
          proposalsToReview: proposalsCount,
          activeTasks: tasksCount,
          cashPending: cash._count._all,
          cashPendingPaise: Number(cash._sum.amountPaise ?? 0),
          duesPending,
          myProposalsPending: mine('PENDING_APPROVAL'),
          myProposalsChangesRequested: mine('CHANGES_REQUESTED'),
        },
      });
    } catch (e) {
      req.log?.error({ err: e }, 'dashboard counts failed');
      return res.status(500).json({ error: { message: 'Failed to calculate dashboard counts' } });
    }
  });

  // 4. Dynamic Student Personal Dashboard Hub (/me)
  router.get('/dashboard/me', authenticate, async (req, res) => {
    try {
      const userId = req.user.sub;

      const [user, nextTicket, openOrdersCount, activeTasksCount] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          include: {
            memberships: {
              where: { status: 'ACTIVE' },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        }),
        // The soonest upcoming event the user holds a pass for.
        prisma.ticket.findFirst({
          where: { userId, status: 'ISSUED', event: { endAt: { gte: new Date() } } },
          select: { id: true, status: true, event: { select: { id: true, title: true, venue: true, startAt: true, endAt: true } } },
          orderBy: { event: { startAt: 'asc' } },
        }),
        prisma.order.count({
          where: { userId, status: { in: ['PENDING_PAYMENT', 'PAID', 'READY'] } },
        }),
        prisma.taskAssignee.count({
          where: {
            userId,
            removedAt: null,
            task: { status: { in: ['TODO', 'IN_PROGRESS'] } },
          },
        }),
      ]);

      return res.json({
        data: {
          user: {
            id: user?.id || userId,
            name: user?.name || req.user.name,
            studentId: user?.studentId || null,
            email: user?.email || req.user.email,
          },
          membership: user?.memberships?.[0] || null,
          nextTicket: nextTicket || null,
          openOrdersCount: openOrdersCount || 0,
          activeTasksCount: activeTasksCount || 0,
        },
      });
    } catch (e) {
      req.log?.error({ err: e }, 'personal dashboard failed');
      return res.status(500).json({ error: { message: 'Failed to load personal dashboard data' } });
    }
  });

  return router;
}
