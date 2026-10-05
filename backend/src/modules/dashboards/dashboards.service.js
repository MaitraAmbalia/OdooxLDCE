import { AppError } from '../../lib/AppError.js';

export function createDashboardsService({ prisma }) {
  return {
    async getDashboard(userId, role, userPermissions = []) {
      const now = new Date();

      switch (role) {
        case 'me': {
          const [membership, tickets, claims, orders] = await Promise.all([
            prisma.membership.findFirst({ where: { userId, status: 'ACTIVE', expiresAt: { gte: now } }, include: { tier: true } }),
            prisma.ticket.count({ where: { userId, status: { in: ['ISSUED', 'CHECKED_IN'] } } }),
            prisma.expenseClaim.count({ where: { submittedById: userId, status: { notIn: ['PAID', 'REJECTED'] } } }),
            prisma.order.count({ where: { userId, status: 'PAID' } })
          ]);
          return {
            type: 'me',
            activeMembership: membership ? { tier: membership.tier.name, expiresAt: membership.expiresAt } : null,
            myTicketsCount: tickets,
            pendingClaimsCount: claims,
            paidOrdersCount: orders,
          };
        }

        case 'mentor': {
          if (!userPermissions.includes('mentor.dashboard')) throw new AppError('FORBIDDEN', 403, 'Requires mentor dashboard permission');
          const [pendingEvents, pendingClaims, budgetAllocations] = await Promise.all([
            prisma.event.count({ where: { status: 'PENDING_APPROVAL' } }),
            prisma.expenseClaim.count({ where: { status: 'APPROVED_L1' } }), // Mentor is final approver for high claims
            prisma.budgetAllocation.aggregate({ _sum: { amountPaise: true } })
          ]);
          return {
            type: 'mentor',
            pendingEventProposals: pendingEvents,
            pendingExpenseApprovals: pendingClaims,
            totalAllocatedPaise: Number(budgetAllocations._sum.amountPaise || 0),
          };
        }

        case 'president': {
          if (!userPermissions.includes('president.dashboard')) throw new AppError('FORBIDDEN', 403, 'Requires president dashboard permission');
          const [activeMembers, pendingClaims, events] = await Promise.all([
            prisma.membership.count({ where: { status: 'ACTIVE', expiresAt: { gte: now } } }),
            prisma.expenseClaim.count({ where: { status: 'SUBMITTED' } }),
            prisma.event.count({ where: { status: 'PUBLISHED', startAt: { gte: now } } })
          ]);
          return {
            type: 'president',
            activeMembers,
            pendingClaims,
            upcomingEvents: events,
          };
        }

        case 'treasurer': {
          if (!userPermissions.includes('treasurer.dashboard')) throw new AppError('FORBIDDEN', 403, 'Requires treasurer dashboard permission');
          const [[balanceRow], unverifiedCash, pendingClaims] = await Promise.all([
            prisma.$queryRaw`SELECT COALESCE(SUM(CASE direction WHEN 'IN' THEN amount_paise ELSE -amount_paise END), 0)::bigint AS balance FROM ledger_entries WHERE status = 'POSTED'`,
            prisma.cashCollection.count({ where: { status: 'PENDING_VERIFICATION' } }),
            prisma.expenseClaim.count({ where: { status: 'SUBMITTED' } })
          ]);
          return {
            type: 'treasurer',
            balancePaise: Number(balanceRow.balance),
            unverifiedCashCount: unverifiedCash,
            pendingClaimsCount: pendingClaims,
          };
        }

        case 'event-head': {
          if (!userPermissions.includes('event-head.dashboard')) throw new AppError('FORBIDDEN', 403, 'Requires event-head dashboard permission');
          const [activeEvents, totalTicketsSold] = await Promise.all([
            prisma.event.count({ where: { status: 'PUBLISHED' } }),
            prisma.event.aggregate({ _sum: { seatsSold: true }, where: { status: 'PUBLISHED' } })
          ]);
          return {
            type: 'event-head',
            activeEvents,
            totalTicketsSold: Number(totalTicketsSold._sum.seatsSold || 0),
          };
        }

        case 'marketing-head': {
          if (!userPermissions.includes('marketing-head.dashboard')) throw new AppError('FORBIDDEN', 403, 'Requires marketing-head dashboard permission');
          const [activeMembers, totalMerchSold] = await Promise.all([
            prisma.membership.count({ where: { status: 'ACTIVE', expiresAt: { gte: now } } }),
            prisma.order.count({ where: { status: 'PAID' } })
          ]);
          return {
            type: 'marketing-head',
            activeMembers,
            totalMerchOrders: totalMerchSold,
          };
        }

        default:
          throw new AppError('NOT_FOUND', 404, 'Dashboard role not found');
      }
    }
  };
}
