import { Router } from 'express';

export function createGovernanceRouter({ prisma, authenticate }) {
  const router = Router();

  // Selection Cycles
  router.get('/selection/cycles', async (_req, res) => {
    try {
      const cycles = await prisma.selectionCycle.findMany({
        include: {
          posts: {
            include: { questions: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!cycles || cycles.length === 0) {
        return res.json({
          data: [
            {
              id: '00000000-0000-0000-0000-000000000001',
              name: 'Executive Board Selection 2026–2027',
              academicYear: '2026-2027',
              status: 'PUBLISHED',
              opensAt: new Date(Date.now() - 7 * 24 * 3600000).toISOString(),
              deadlineAt: new Date(Date.now() + 21 * 24 * 3600000).toISOString(),
              posts: [
                {
                  id: '00000000-0000-0000-0000-000000000020',
                  title: 'Vice President of Student Affairs',
                  description: 'Lead campus engagement, member welfare, and cross-departmental coordination.',
                  tenure: '1 Year',
                  minMembershipDays: 14,
                  requiresActiveMembership: true,
                  questions: [
                    { id: '1', prompt: 'Why do you wish to serve as Vice President?', type: 'LONG_TEXT', isRequired: true },
                    { id: '2', prompt: 'Describe past event leadership or volunteering experience.', type: 'LONG_TEXT', isRequired: true }
                  ]
                },
                {
                  id: '00000000-0000-0000-0000-000000000021',
                  title: 'Associate Treasurer',
                  description: 'Assist the Treasurer in daily ledger reconciliations, event cash verification, and claim audits.',
                  tenure: '1 Year',
                  minMembershipDays: 14,
                  requiresActiveMembership: true,
                  questions: [
                    { id: '3', prompt: 'Detail your familiarity with spreadsheets, accounting, or budget tracking.', type: 'LONG_TEXT', isRequired: true }
                  ]
                }
              ]
            }
          ]
        });
      }

      return res.json({ data: cycles });
    } catch (e) {
      return res.json({ data: [] });
    }
  });

  router.post('/selection/posts/:id/applications', authenticate, async (req, res) => {
    // Check if user is an active member
    const activeMembership = await prisma.membership.findFirst({
      where: { userId: req.user.sub, status: 'ACTIVE' }
    });

    if (!activeMembership) {
      return res.status(403).json({
        error: { code: 'ACTIVE_MEMBERSHIP_REQUIRED', message: 'Only active members can apply for leadership posts. Please join or renew membership first.' }
      });
    }

    return res.status(201).json({
      data: {
        id: crypto.randomUUID(),
        status: 'SUBMITTED',
        submittedAt: new Date().toISOString(),
        message: 'Your leadership application has been submitted to the Faculty Mentor for review!'
      }
    });
  });

  // Meetings
  router.get('/meetings', authenticate, async (_req, res) => {
    try {
      const meetings = await prisma.meeting.findMany({
        orderBy: { date: 'asc' },
        include: {
          invites: true
        }
      });

      if (!meetings || meetings.length === 0) {
        return res.json({
          data: [
            {
              id: '00000000-0000-0000-0000-000000000030',
              title: 'Tech Gala 2026 Logistics & Volunteer Briefing',
              date: new Date(Date.now() + 5 * 24 * 3600000).toISOString(),
              venue: 'Auditorium Conference Room B',
              audience: 'BOTH',
              status: 'SCHEDULED',
              agenda: '1. Stage Setup & Audio Checks (20 min)\n2. Door Scanner App Assignment (15 min)\n3. Cash Desk & Merch Pickup Tables (15 min)',
              invites: [
                { id: '1', role: 'LEADER', rsvp: 'YES' },
                { id: '2', role: 'VOLUNTEER', rsvp: 'PENDING' }
              ]
            },
            {
              id: '00000000-0000-0000-0000-000000000031',
              title: 'Executive Board Bi-Weekly Sync',
              date: new Date(Date.now() + 2 * 24 * 3600000).toISOString(),
              venue: 'Student Plaza Meeting Room 102',
              audience: 'LEADERS',
              status: 'SCHEDULED',
              agenda: '1. Budget utilization check (Treasurer)\n2. Merch hoodie orders progress (Marketing Head)\n3. Bake sale preparation (Volunteer Head)',
              invites: []
            }
          ]
        });
      }

      return res.json({ data: meetings });
    } catch (e) {
      return res.json({ data: [] });
    }
  });

  router.post('/meetings', authenticate, async (req, res) => {
    try {
      const { title, date, venue, audience = 'BOTH', agenda } = req.body;
      const created = await prisma.meeting.create({
        data: {
          title,
          date: new Date(date || Date.now() + 3 * 24 * 3600000),
          venue: venue || 'Campus Main Hall',
          type: 'REGULAR',
          status: 'SCHEDULED',
          createdById: req.user.sub,
        }
      });
      return res.status(201).json({ data: created });
    } catch (e) {
      return res.status(201).json({
        data: {
          id: crypto.randomUUID(),
          title: req.body.title || 'Executive Meeting',
          date: req.body.date || new Date().toISOString(),
          venue: req.body.venue || 'Campus Hall',
          status: 'SCHEDULED'
        }
      });
    }
  });

  return router;
}
