import { Router } from 'express';
import { AppError } from '../../lib/AppError.js';

function roleTitle(role) {
  return role.toLowerCase().split('_').map((part) => part[0].toUpperCase() + part.slice(1)).join(' ');
}

function formatCycle(cycle) {
  return {
    ...cycle,
    name: cycle.title,
    opensAt: cycle.applicationsOpenAt,
    deadlineAt: cycle.applicationsCloseAt,
    posts: cycle.posts.map((post) => ({
      ...post,
      title: roleTitle(post.role),
      capacity: post.seats,
      tenure: new Date(cycle.termStart).getFullYear() + '–' + new Date(cycle.termEnd).getFullYear(),
      requiresActiveMembership: post.minMembershipDays > 0,
      questions: post.questions.map((question) => ({
        ...question,
        prompt: question.label,
        isRequired: question.required,
        type: question.type === 'TEXTAREA' ? 'LONG_TEXT' : question.type,
      })),
    })),
  };
}

export function createGovernanceRouter({ prisma, authenticate }) {
  const router = Router();

  router.get('/selection/cycles', async (_req, res) => {
    const cycles = await prisma.selectionCycle.findMany({
      include: { posts: { include: { questions: { orderBy: { sortOrder: 'asc' } } } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ data: cycles.map(formatCycle) });
  });

  router.post('/selection/cycles', authenticate, async (req, res) => {
    const input = req.body;
    const created = await prisma.selectionCycle.create({
      data: {
        title: input.name || input.title,
        termStart: new Date(input.termStart),
        termEnd: new Date(input.termEnd),
        applicationsOpenAt: input.applicationsOpenAt ? new Date(input.applicationsOpenAt) : new Date(),
        applicationsCloseAt: new Date(input.deadlineAt || input.applicationsCloseAt),
        maxApplicationsPerMember: Number(input.maxApplicationsPerMember || 1),
        status: input.status || 'DRAFT',
        createdById: req.user.sub,
      },
      include: { posts: { include: { questions: true } } },
    });
    return res.status(201).json({ data: formatCycle(created) });
  });

  router.patch('/selection/cycles/:id', authenticate, async (req, res) => {
    const input = req.body;
    const updated = await prisma.selectionCycle.update({
      where: { id: req.params.id },
      data: {
        title: input.name || input.title,
        termStart: input.termStart ? new Date(input.termStart) : undefined,
        termEnd: input.termEnd ? new Date(input.termEnd) : undefined,
        applicationsOpenAt: input.applicationsOpenAt ? new Date(input.applicationsOpenAt) : undefined,
        applicationsCloseAt: input.deadlineAt || input.applicationsCloseAt ? new Date(input.deadlineAt || input.applicationsCloseAt) : undefined,
        maxApplicationsPerMember: input.maxApplicationsPerMember ? Number(input.maxApplicationsPerMember) : undefined,
        status: input.status,
      },
      include: { posts: { include: { questions: true } } },
    });
    return res.json({ data: formatCycle(updated) });
  });

  router.post('/selection/cycles/:id/posts', authenticate, async (req, res) => {
    const input = req.body;
    const post = await prisma.selectionPost.create({
      data: {
        cycleId: req.params.id,
        role: input.role,
        seats: Number(input.seats || 1),
        description: input.description,
        minMembershipDays: Number(input.minMembershipDays || 0),
        questions: {
          create: input.questions || []
        }
      },
      include: { questions: true }
    });
    return res.status(201).json({ data: post });
  });

  router.delete('/selection/posts/:id', authenticate, async (req, res) => {
    await prisma.selectionPost.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  });

  router.post('/selection/posts/:id/applications', authenticate, async (req, res) => {
    const now = new Date();
    const post = await prisma.selectionPost.findUnique({
      where: { id: req.params.id },
      include: { cycle: true, questions: true },
    });
    if (!post) throw new AppError('NOT_FOUND', 404, 'Leadership position not found');
    if (post.cycle.status !== 'OPEN' || now < post.cycle.applicationsOpenAt || now > post.cycle.applicationsCloseAt) {
      throw new AppError('APPLICATIONS_CLOSED', 400, 'Applications are not open for this position');
    }

    const activeMembership = await prisma.membership.findFirst({
      where: { userId: req.user.sub, status: 'ACTIVE', expiresAt: { gte: now } },
    });
    if (!activeMembership) {
      throw new AppError('ACTIVE_MEMBERSHIP_REQUIRED', 403, 'Only active members can apply for leadership posts');
    }

    const applicationCount = await prisma.application.count({
      where: { applicantId: req.user.sub, post: { cycleId: post.cycleId } },
    });
    if (applicationCount >= post.cycle.maxApplicationsPerMember) {
      throw new AppError('APPLICATION_LIMIT_REACHED', 409, 'You have reached the application limit for this cycle');
    }

    const answers = req.body.answers || {};
    const missingRequired = post.questions.find((question) => question.required && (answers[question.id] === undefined || answers[question.id] === ''));
    if (missingRequired) throw new AppError('ANSWER_REQUIRED', 400, 'Please answer every required question');

    const application = await prisma.application.create({
      data: {
        postId: post.id,
        applicantId: req.user.sub,
        status: 'SUBMITTED',
        answers: {
          create: post.questions
            .filter((question) => answers[question.id] !== undefined)
            .map((question) => ({ questionId: question.id, value: answers[question.id] })),
        },
      },
      include: { answers: true },
    });

    return res.status(201).json({ data: { id: application.id, status: application.status, submittedAt: application.createdAt } });
  });

  router.get('/selection/cycles/:id/applications', authenticate, async (req, res) => {
    const applications = await prisma.application.findMany({
      where: { post: { cycleId: req.params.id } },
      include: {
        applicant: { select: { id: true, name: true, studentId: true, email: true } },
        post: true,
        answers: { include: { question: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      data: applications.map((application) => ({
        id: application.id,
        status: application.status,
        submittedAt: application.createdAt,
        reviewerNote: application.reviewerNote,
        user: application.applicant,
        post: { ...application.post, title: roleTitle(application.post.role) },
        answers: Object.fromEntries(application.answers.map((answer) => [answer.question.label, answer.value])),
      })),
    });
  });

  router.patch('/selection/applications/:id/status', authenticate, async (req, res) => {
    const { status, note } = req.body;
    
    if (!req.user.roles || !req.user.roles.includes('MENTOR')) {
       throw new AppError('FORBIDDEN', 403, 'Only mentors can review applications');
    }

    const application = await prisma.application.findUnique({
      where: { id: req.params.id },
      include: { post: { include: { cycle: true } } }
    });

    if (!application) throw new AppError('NOT_FOUND', 404, 'Application not found');

    if (status === 'APPOINTED') {
      const updated = await prisma.$transaction(async (tx) => {
        const app = await tx.application.update({
          where: { id: req.params.id },
          data: { status, reviewerNote: note }
        });

        await tx.roleAssignment.updateMany({
          where: { role: application.post.role, endedAt: null },
          data: { endedAt: new Date() }
        });

        const assignment = await tx.roleAssignment.create({
          data: {
            userId: application.applicantId,
            role: application.post.role,
            termStart: application.post.cycle.termStart,
            termEnd: application.post.cycle.termEnd,
            source: 'SELECTION',
            createdById: req.user.sub,
            reason: `Selected via ${application.post.cycle.title}`,
          }
        });

        await tx.appointment.create({
          data: {
            applicationId: app.id,
            roleAssignmentId: assignment.id,
            appointedById: req.user.sub,
          }
        });
        
        return app;
      });
      return res.json({ data: updated });
    } else {
      const app = await prisma.application.update({
        where: { id: req.params.id },
        data: { status, reviewerNote: note }
      });
      return res.json({ data: app });
    }
  });

  router.get('/meetings', authenticate, async (_req, res) => {
    const meetings = await prisma.meeting.findMany({
      orderBy: { startAt: 'asc' },
      include: {
        agendaItems: { orderBy: { sortOrder: 'asc' }, include: { owner: { select: { id: true, name: true } } } },
        invites: { include: { user: { select: { id: true, name: true, studentId: true } } } },
      },
    });

    return res.json({
      data: meetings.map((meeting) => ({
        ...meeting,
        date: meeting.startAt,
        venue: meeting.location || meeting.meetingLink,
        agenda: meeting.agendaItems,
      })),
    });
  });

  router.post('/meetings', authenticate, async (req, res) => {
    const { title, date, startAt, endAt, venue, location, meetingLink, audience = 'BOTH', agendaItems, agenda } = req.body;
    const starts = new Date(startAt || date);
    if (Number.isNaN(starts.getTime())) throw new AppError('INVALID_DATE', 400, 'A valid meeting date is required');
    const ends = endAt ? new Date(endAt) : new Date(starts.getTime() + 60 * 60 * 1000);
    const parsedAgenda = Array.isArray(agendaItems)
      ? agendaItems
      : typeof agenda === 'string'
        ? agenda.split('\n').map((topic) => ({ topic: topic.trim(), durationMin: 15 })).filter((item) => item.topic)
        : [];

    const created = await prisma.meeting.create({
      data: {
        title,
        startAt: starts,
        endAt: ends,
        location: location || venue || null,
        meetingLink: meetingLink || null,
        audience,
        status: 'SCHEDULED',
        createdById: req.user.sub,
        agendaItems: parsedAgenda.length ? {
          create: parsedAgenda.map((item, index) => ({
            sortOrder: index + 1,
            topic: item.topic,
            ownerId: item.ownerId || null,
            durationMin: Number(item.durationMin || item.minutes || 15),
          })),
        } : undefined,
      },
      include: { agendaItems: { orderBy: { sortOrder: 'asc' } }, invites: true },
    });
    return res.status(201).json({ data: { ...created, date: created.startAt, venue: created.location, agenda: created.agendaItems } });
  });

  return router;
}
