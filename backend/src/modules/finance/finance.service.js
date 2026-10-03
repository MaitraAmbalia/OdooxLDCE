import { randomUUID } from 'node:crypto';
import { AppError } from '../../lib/AppError.js';
import { parsePeriod } from '../../lib/period.js';
import { createPageMeta, parsePagination, parseSort } from '../../lib/pagination.js';
import { auditLog } from '../../utils/audit.js';

const notFound = () => new AppError('NOT_FOUND', 404, 'Ledger entry not found');
// Posted by payments (DUES/TICKETS/MERCH) or via /budgets/allocations: never by hand.
const SYSTEM_ONLY = ['DUES', 'TICKETS', 'MERCH', 'BUDGET_ALLOCATION'];

// BigInt is not JSON-serialisable; paise amounts fit in a Number.
const toPublic = (e) => ({
  id: e.id, direction: e.direction, category: e.category, amountPaise: Number(e.amountPaise),
  sourceType: e.sourceType, sourceId: e.sourceId, eventId: e.eventId, projectId: e.projectId,
  description: e.description, occurredAt: e.occurredAt, recordedBy: e.recordedById,
  reversesEntryId: e.reversesEntryId, attachmentFileId: e.attachmentFileId, createdAt: e.createdAt,
  date: e.occurredAt ? new Date(e.occurredAt).toISOString().split('T')[0] : new Date(e.createdAt).toISOString().split('T')[0],
  type: e.direction === 'IN' ? 'INCOME' : 'EXPENSE',
});
const toAllocation = (a) => ({ id: a.id, period: a.period, amountPaise: Number(a.amountPaise), source: a.source, note: a.note, createdAt: a.createdAt });

// ------------------------------------------------------------------ internal contract
// Called by other modules INSIDE their own transaction (`tx`), so the ledger row commits or rolls
// back with the business change. A repeated (sourceType, sourceId) is silently ignored (ON CONFLICT
// DO NOTHING), which is what makes webhook replays safe. Returns true if a new row was written.
async function post(direction, entry, tx) {
  if (!Number.isSafeInteger(entry.amountPaise) || entry.amountPaise <= 0) {
    throw new AppError('VALIDATION_ERROR', 400, 'amountPaise must be a positive integer');
  }
  const { count } = await tx.ledgerEntry.createMany({
    data: [{
      direction, category: entry.category, amountPaise: BigInt(entry.amountPaise),
      sourceType: entry.sourceType, sourceId: entry.sourceId,
      eventId: entry.eventId ?? null, projectId: entry.projectId ?? null,
      description: entry.description, occurredAt: entry.occurredAt ?? new Date(),
      recordedById: entry.recordedBy ?? null, // null = posted by the system
    }],
    skipDuplicates: true,
  });
  return count === 1;
}
export const postIncome = (entry, tx) => post('IN', entry, tx);
export const postExpense = (entry, tx) => post('OUT', entry, tx);
// A refund paid out to a customer: money OUT, category REFUND.
export const postRefund = (entry, tx) => post('OUT', { ...entry, category: 'REFUND', sourceType: 'REFUND' }, tx);

// ------------------------------------------------------------------ HTTP-facing service
// `files` = the files service (assertUsable / attach), used for ledger attachments.
export function createFinanceService({ prisma, files }) {
  async function list(q) {
    const page = parsePagination(q);
    const sort = parseSort(q.sort, ['occurredAt', 'createdAt'], 'occurredAt:desc');
    const direction = q.direction || (q.type === 'INCOME' ? 'IN' : q.type === 'EXPENSE' ? 'OUT' : undefined);
    const where = {
      ...(direction && { direction }),
      ...(q.category && { category: q.category }),
      ...(q.sourceType && { sourceType: q.sourceType }),
      ...(q.eventId && { eventId: q.eventId }),
      ...(q.projectId && { projectId: q.projectId }),
      ...((q.from || q.to) && { occurredAt: { ...(q.from && { gte: q.from }), ...(q.to && { lte: q.to }) } }),
    };
    const [rows, total] = await Promise.all([
      prisma.ledgerEntry.findMany({ where, orderBy: sort.orderBy, skip: page.skip, take: page.take }),
      prisma.ledgerEntry.count({ where }),
    ]);
    return { data: rows.map(toPublic), meta: createPageMeta(page, total) };
  }

  // Balance = IN - OUT, computed (never stored).
  async function balance() {
    const [row] = await prisma.$queryRaw`
      SELECT COALESCE(SUM(CASE direction WHEN 'IN' THEN amount_paise ELSE -amount_paise END), 0)::bigint AS balance
      FROM ledger_entries`;
    return { balancePaise: Number(row.balance) };
  }

  async function get(id) {
    const entry = await prisma.ledgerEntry.findUnique({ where: { id } });
    if (!entry) throw notFound();
    // `source` lets the UI link back to the payment/claim/etc. that caused the entry.
    return { ...toPublic(entry), source: { type: entry.sourceType, id: entry.sourceId } };
  }

  async function createManual(actor, body, req) {
    if (SYSTEM_ONLY.includes(body.category)) {
      throw new AppError('VALIDATION_ERROR', 400, 'This category is posted by the system only', [{ path: ['body', 'category'], message: `${body.category} cannot be posted manually` }]);
    }
    // Check tags up front so a bad id is a clean 422, not a foreign-key 500.
    if (body.eventId && !(await prisma.event.findUnique({ where: { id: body.eventId }, select: { id: true } }))) {
      throw new AppError('VALIDATION_ERROR', 422, 'Unknown event', [{ path: ['body', 'eventId'], message: 'Event not found' }]);
    }
    if (body.projectId && !(await prisma.project.findUnique({ where: { id: body.projectId }, select: { id: true } }))) {
      throw new AppError('VALIDATION_ERROR', 422, 'Unknown project', [{ path: ['body', 'projectId'], message: 'Project not found' }]);
    }
    return prisma.$transaction(async (tx) => {
      // The ledger is append-only, so a file can only be linked when the entry is created:
      // check it (owned by the actor, unattached, right purpose), create the entry, attach it, all in one tx.
      if (body.attachmentFileId) {
        await files.assertUsable([body.attachmentFileId], { ownerId: actor.id, purpose: 'LEDGER_ATTACHMENT' }, tx);
      }
      const entry = await tx.ledgerEntry.create({
        data: {
          direction: body.direction, category: body.category, amountPaise: BigInt(body.amountPaise),
          sourceType: 'MANUAL', sourceId: randomUUID(), eventId: body.eventId ?? null, projectId: body.projectId ?? null,
          description: body.description, occurredAt: body.occurredAt, recordedById: actor.id,
          attachmentFileId: body.attachmentFileId ?? null,
        },
      });
      if (body.attachmentFileId) await files.attach([body.attachmentFileId], { type: 'ledger_entry', id: entry.id }, tx);
      const out = toPublic(entry);
      await auditLog({ actorId: actor.id, action: 'LEDGER.MANUAL', entityType: 'ledger_entry', entityId: entry.id, after: out, req }, tx);
      return out;
    });
  }

  // Ledger rows are never edited; a mistake is undone by a mirror entry that points back at it.
  async function reverse(actor, id, { reason }, req) {
    try {
      return await prisma.$transaction(async (tx) => {
        const original = await tx.ledgerEntry.findUnique({ where: { id } });
        if (!original) throw notFound();
        if (original.sourceType === 'REVERSAL') throw new AppError('INVALID_STATE_TRANSITION', 409, 'A reversal entry cannot be reversed');
        const entry = await tx.ledgerEntry.create({
          data: {
            direction: original.direction === 'IN' ? 'OUT' : 'IN', category: original.category, amountPaise: original.amountPaise,
            sourceType: 'REVERSAL', sourceId: original.id, // unique (REVERSAL, original) => a second reverse fails
            reversesEntryId: original.id, eventId: original.eventId, projectId: original.projectId,
            description: `Reversal: ${reason}`,
            // Same date as the original so period totals (budget utilisation) net out; real time = createdAt.
            occurredAt: original.occurredAt, recordedById: actor.id,
          },
        });
        const out = toPublic(entry);
        await auditLog({ actorId: actor.id, action: 'LEDGER.REVERSE', entityType: 'ledger_entry', entityId: original.id, before: toPublic(original), after: out, req }, tx);
        return out;
      });
    } catch (e) {
      if (e.code === 'P2002') throw new AppError('ALREADY_REVERSED', 409, 'This entry was already reversed');
      throw e;
    }
  }

  // ---------------------------------------------------------------- budgets
  // The allocation row and its ledger IN entry commit together or not at all.
  async function allocate(actor, body, req) {
    return prisma.$transaction(async (tx) => {
      const a = await tx.budgetAllocation.create({
        data: { period: body.period, amountPaise: BigInt(body.amountPaise), source: body.source, note: body.note ?? null, allocatedById: actor.id },
      });
      await postIncome(
        { category: 'BUDGET_ALLOCATION', amountPaise: body.amountPaise, sourceType: 'ALLOCATION', sourceId: a.id, description: `Budget allocation ${body.period} (${body.source})`, recordedBy: actor.id },
        tx,
      );
      await auditLog({ actorId: actor.id, action: 'BUDGET.ALLOCATE', entityType: 'budget_allocation', entityId: a.id, after: toAllocation(a), req }, tx);
      return toAllocation(a);
    });
  }

  async function listAllocations(period) {
    const rows = await prisma.budgetAllocation.findMany({ where: period ? { period } : {}, orderBy: { createdAt: 'desc' } });
    return rows.map(toAllocation);
  }

  async function setLimits(actor, { period, limits }, req) {
    return prisma.$transaction(async (tx) => {
      for (const l of limits) {
        await tx.budgetLimit.upsert({
          where: { period_category: { period, category: l.category } },
          create: { period, category: l.category, limitPaise: BigInt(l.limitPaise) },
          update: { limitPaise: BigInt(l.limitPaise) },
        });
      }
      const rows = await tx.budgetLimit.findMany({ where: { period } });
      const out = { period, limits: rows.map((r) => ({ category: r.category, limitPaise: Number(r.limitPaise) })) };
      await auditLog({ actorId: actor.id, action: 'BUDGET.LIMITS_SET', entityType: 'budget_limit', after: out, req }, tx);
      return out;
    });
  }

  // Per category: limit, net spend inside the period, remaining. Spend = OUT entries minus the IN
  // legs of reversals (reversal-OUT legs undo income, so they are not spend).
  async function utilization(period) {
    const { start, end } = parsePeriod(period); // period already validated by zod
    const [limits, spentRows] = await Promise.all([
      prisma.budgetLimit.findMany({ where: { period } }),
      prisma.$queryRaw`
        SELECT category::text AS category,
               SUM(CASE WHEN direction = 'OUT' AND source_type <> 'REVERSAL' THEN amount_paise
                        WHEN direction = 'IN'  AND source_type =  'REVERSAL' THEN -amount_paise
                        ELSE 0 END)::bigint AS spent
        FROM ledger_entries
        WHERE occurred_at >= ${start} AND occurred_at < ${end}
        GROUP BY category`,
    ]);
    const limitBy = new Map(limits.map((l) => [l.category, Number(l.limitPaise)]));
    const spentBy = new Map(spentRows.map((r) => [r.category, Number(r.spent)]));
    // Show a category only if it has a limit or net spend (income-only categories sum to 0).
    const categories = [...new Set([...limitBy.keys(), ...[...spentBy].filter(([, v]) => v !== 0).map(([k]) => k)])].sort();
    return {
      period,
      categories: categories.map((category) => {
        const limitPaise = limitBy.get(category) ?? null; // null = no limit configured
        const spentPaise = spentBy.get(category) ?? 0;
        return { category, limitPaise, spentPaise, remainingPaise: limitPaise === null ? null : limitPaise - spentPaise };
      }),
    };
  }

  async function budgetOverview() {
    const limits = await prisma.budgetLimit.findMany({
      orderBy: { category: 'asc' },
    });
    const spentAggs = await prisma.ledgerEntry.groupBy({
      by: ['category'],
      where: { direction: 'OUT' },
      _sum: { amountPaise: true },
    });
    const spentMap = new Map(spentAggs.map((r) => [r.category, Number(r._sum.amountPaise || 0)]));
    return limits.map((l) => ({
      id: l.id,
      category: l.category,
      allocatedPaise: Number(l.limitPaise),
      spentPaise: spentMap.get(l.category) || 0,
    }));
  }

  async function reportSummary(type = 'SUMMARY') {
    const baseWhere = {};
    if (type === 'EVENT') baseWhere.eventId = { not: null };
    if (type === 'PROJECT') baseWhere.projectId = { not: null };

    const [incomeAgg, expenseAgg, rowCount] = await Promise.all([
      prisma.ledgerEntry.aggregate({
        where: { ...baseWhere, direction: 'IN' },
        _sum: { amountPaise: true },
      }),
      prisma.ledgerEntry.aggregate({
        where: { ...baseWhere, direction: 'OUT' },
        _sum: { amountPaise: true },
      }),
      prisma.ledgerEntry.count({ where: baseWhere }),
    ]);

    const totalIncomePaise = Number(incomeAgg._sum.amountPaise || 0);
    const totalExpensePaise = Number(expenseAgg._sum.amountPaise || 0);

    return {
      reportType: type,
      totalIncomePaise,
      totalExpensePaise,
      balancePaise: totalIncomePaise - totalExpensePaise,
      rowCount,
    };
  }

  async function listCashCollections(status, query = {}) {
    const page = parsePagination(query, { defaultLimit: 50 });
    const where = status ? { status: status === 'PENDING' ? 'PENDING_VERIFICATION' : status } : undefined;
    const [rows, total] = await Promise.all([
      prisma.cashCollection.findMany({
        where,
        include: {
          collectedBy: { select: { id: true, name: true } },
          payer: { select: { id: true, name: true, studentId: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: page.skip,
        take: page.take,
      }),
      prisma.cashCollection.count({ where }),
    ]);
    const data = rows.map((c) => ({
      id: c.id,
      operator: c.collectedBy?.name || 'Cash Operator',
      payerInfo: c.payer ? `${c.payer.name} / ${c.payer.studentId}` : 'Student',
      amountPaise: Number(c.amountPaise),
      purpose: c.purpose,
      status: c.status === 'PENDING_VERIFICATION' ? 'PENDING' : c.status,
      recordedAt: c.createdAt,
    }));
    return { data, meta: createPageMeta(page, total) };
  }

  async function createCashCollection(user, input) {
    const row = await prisma.cashCollection.create({
      data: {
        collectedById: user.id,
        purpose: input.purpose || 'MEMBERSHIP',
        refId: input.refId || randomUUID(),
        amountPaise: BigInt(input.amountPaise || 15000),
        status: 'PENDING_VERIFICATION',
      },
    });
    return { id: row.id, status: 'PENDING' };
  }

  async function verifyCashCollection(verifier, id) {
    const row = await prisma.cashCollection.update({
      where: { id },
      data: {
        status: 'VERIFIED',
        verifiedById: verifier.id,
        verifiedAt: new Date(),
      },
    });
    return { id: row.id, status: 'VERIFIED' };
  }

  async function listClaims(filter = {}) {
    const page = parsePagination(filter, { defaultLimit: 50 });
    const where = {};
    if (filter.userId) {
      where.submittedById = filter.userId;
    }
    if (filter.status) {
      where.status = filter.status;
    }
    const [rows, total] = await Promise.all([
      prisma.expenseClaim.findMany({
        where,
        include: {
          submittedBy: { select: { id: true, name: true, studentId: true } },
          event: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: page.skip,
        take: page.take,
      }),
      prisma.expenseClaim.count({ where }),
    ]);
    const data = rows.map((c) => ({
      id: c.id,
      submitter: c.submittedBy?.name || 'Volunteer',
      amountPaise: Number(c.amountPaise),
      description: c.description,
      status: c.status,
      createdAt: c.createdAt,
      link: c.event ? c.event.title : 'General Volunteer Expense',
      ageDays: Math.floor((Date.now() - new Date(c.createdAt).getTime()) / (24 * 3600 * 1000)),
      receiptUrls: [],
    }));
    return { data, meta: createPageMeta(page, total) };
  }

  async function submitClaim(user, input) {
    let cat = 'REIMBURSEMENT';
    if (input.category) {
      const up = input.category.toUpperCase().replace(/\s*&\s*/g, '_').trim();
      const valid = ['DUES', 'TICKETS', 'MERCH', 'FUNDRAISER', 'BUDGET_ALLOCATION', 'SPONSORSHIP', 'REIMBURSEMENT', 'PURCHASE', 'REFUND', 'OTHER'];
      if (valid.includes(up)) {
        cat = up;
      } else if (up === 'FOOD___BEV' || up === 'FOOD_BEV' || up === 'LOGISTICS' || up === 'TRAVEL') {
        cat = 'PURCHASE';
      }
    }
    const amountPaise = BigInt(Math.max(1, Math.round(Number(input.amountPaise || 10000))));
    const route = amountPaise > 200000n ? 'HIGH_VALUE' : 'STANDARD';
    const spentAt = input.dateSpent && !isNaN(new Date(input.dateSpent).getTime())
      ? new Date(input.dateSpent)
      : new Date();

    const row = await prisma.expenseClaim.create({
      data: {
        submittedById: user.id || user.sub,
        amountPaise,
        category: cat,
        route,
        description: input.description || 'Expense claim',
        spentAt,
        status: 'SUBMITTED',
      },
    });
    return {
      id: row.id,
      status: 'SUBMITTED',
      submittedById: row.submittedById,
      amountPaise: Number(row.amountPaise),
      description: row.description,
    };
  }

  async function reviewClaim(user, id, { decision, reason }) {
    const existing = await prisma.expenseClaim.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('NOT_FOUND', 404, 'Expense claim not found');
    }
    const status = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    const row = await prisma.expenseClaim.update({
      where: { id },
      data: {
        status,
      },
    });

    try {
      await prisma.claimDecision.create({
        data: {
          claimId: id,
          deciderId: user.id,
          level: 'L1',
          decision: decision === 'APPROVE' ? 'APPROVE' : 'REJECT',
          reason: reason || null,
        },
      });
    } catch {
      // non-blocking
    }

    if (status === 'APPROVED') {
      try {
        await prisma.ledgerEntry.create({
          data: {
            direction: 'OUT',
            category: row.category || 'REIMBURSEMENT',
            amountPaise: row.amountPaise,
            description: `Expense reimbursement: ${row.description}`,
            sourceType: 'CLAIM',
            sourceId: row.id,
            eventId: row.eventId || null,
            projectId: row.projectId || null,
            occurredAt: new Date(),
            recordedById: user.id,
          },
        });
      } catch {
        // Safe to ignore duplicate or foreign key errors
      }
    }

    return {
      id: row.id,
      status: row.status,
      submittedById: existing.submittedById,
      amountPaise: Number(row.amountPaise),
      description: row.description,
      reason: reason || null,
    };
  }

  return {
    list, balance, get, createManual, reverse, allocate, listAllocations, setLimits, utilization,
    budgetOverview, reportSummary, listCashCollections, createCashCollection, verifyCashCollection,
    listClaims, submitClaim, reviewClaim,
  };
}
