import { randomUUID } from 'node:crypto';
import { AppError } from '../../lib/AppError.js';
import { parsePeriod } from '../../lib/period.js';
import { createPageMeta, parsePagination, parseSort } from '../../lib/pagination.js';
import { auditLog } from '../../utils/audit.js';
import { notify, notifyMany } from '../../lib/notify.js';
import { eventSpend } from '../events/events.service.js';

const HIGH_VALUE_PAISE = 200000; // claims above ₹2,000 also need the President

const notFound = () => new AppError('NOT_FOUND', 404, 'Ledger entry not found');
// Posted by payments (DUES/TICKETS/MERCH) or via /budgets/allocations: never by hand.
const SYSTEM_ONLY = ['DUES', 'TICKETS', 'MERCH', 'BUDGET_ALLOCATION'];

// BigInt is not JSON-serialisable; paise amounts fit in a Number.
const toPublic = (e) => ({
  id: e.id, direction: e.direction, category: e.category, amountPaise: Number(e.amountPaise),
  sourceType: e.sourceType, sourceId: e.sourceId, eventId: e.eventId, projectId: e.projectId,
  description: e.description, occurredAt: e.occurredAt, recordedBy: e.recordedById,
  reversesEntryId: e.reversesEntryId, attachmentFileId: e.attachmentFileId, createdAt: e.createdAt,
  date: new Date(e.occurredAt ?? e.createdAt).toLocaleDateString('en-CA'), // server-local YYYY-MM-DD
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

  // Totals plus where the money came from / went (tickets, merch, dues, claims...) for reconciliation.
  async function reportSummary(type = 'SUMMARY') {
    const baseWhere = {};
    if (type === 'EVENT') baseWhere.eventId = { not: null };
    if (type === 'PROJECT') baseWhere.projectId = { not: null };

    const [groups, rowCount, events] = await Promise.all([
      prisma.ledgerEntry.groupBy({ by: ['category', 'direction'], where: baseWhere, _sum: { amountPaise: true } }),
      prisma.ledgerEntry.count({ where: baseWhere }),
      type === 'EVENT'
        ? prisma.ledgerEntry.groupBy({ by: ['eventId', 'direction'], where: baseWhere, _sum: { amountPaise: true } })
        : [],
    ]);
    const byCategory = {};
    for (const g of groups) {
      const row = (byCategory[g.category] ??= { category: g.category, inPaise: 0, outPaise: 0 });
      row[g.direction === 'IN' ? 'inPaise' : 'outPaise'] += Number(g._sum.amountPaise ?? 0);
    }
    const totalIncomePaise = groups.filter((g) => g.direction === 'IN').reduce((n, g) => n + Number(g._sum.amountPaise ?? 0), 0);
    const totalExpensePaise = groups.filter((g) => g.direction === 'OUT').reduce((n, g) => n + Number(g._sum.amountPaise ?? 0), 0);

    let byEvent;
    if (type === 'EVENT') {
      const titles = await prisma.event.findMany({ where: { id: { in: [...new Set(events.map((e) => e.eventId))] } }, select: { id: true, title: true, approvedBudgetPaise: true } });
      byEvent = titles.map((e) => {
        const sum = (d) => Number(events.find((r) => r.eventId === e.id && r.direction === d)?._sum.amountPaise ?? 0);
        return { eventId: e.id, title: e.title, inPaise: sum('IN'), outPaise: sum('OUT'), approvedBudgetPaise: e.approvedBudgetPaise != null ? Number(e.approvedBudgetPaise) : null };
      });
    }

    return {
      reportType: type,
      totalIncomePaise,
      totalExpensePaise,
      balancePaise: totalIncomePaise - totalExpensePaise,
      rowCount,
      byCategory: Object.values(byCategory).sort((x, y) => x.category.localeCompare(y.category)),
      byEvent,
    };
  }

  // Reconciliation: every gateway payment next to its ledger entry. A PAID payment with no
  // ledger row (or a ledger row for an unpaid payment) is a mismatch to investigate.
  async function listPayments(q = {}) {
    const page = parsePagination(q, { defaultLimit: 50 });
    const where = { ...(q.status && { status: q.status }), ...(q.purpose && { purpose: q.purpose }) };
    const [rows, total, summary] = await Promise.all([
      prisma.payment.findMany({ where, orderBy: { createdAt: 'desc' }, skip: page.skip, take: page.take, include: { user: { select: { name: true, studentId: true } } } }),
      prisma.payment.count({ where }),
      prisma.payment.groupBy({ by: ['purpose', 'status'], _sum: { amountPaise: true }, _count: { _all: true } }),
    ]);
    const ledger = await prisma.ledgerEntry.findMany({ where: { sourceType: 'PAYMENT', sourceId: { in: rows.map((r) => r.id) } }, select: { sourceId: true, id: true } });
    const ledgerBy = new Map(ledger.map((l) => [l.sourceId, l.id]));
    const unledgered = await prisma.$queryRaw`
      SELECT COUNT(*)::int AS n FROM payments p
      WHERE p.status IN ('PAID', 'REFUNDED')
        AND NOT EXISTS (SELECT 1 FROM ledger_entries l WHERE l.source_type = 'PAYMENT' AND l.source_id = p.id)`;
    return {
      data: rows.map((p) => {
        const ledgerEntryId = ledgerBy.get(p.id) ?? null;
        const settled = ['PAID', 'REFUNDED'].includes(p.status);
        return {
          id: p.id, purpose: p.purpose, status: p.status, provider: p.provider, amountPaise: Number(p.amountPaise),
          payer: p.user ? `${p.user.name} / ${p.user.studentId}` : null, gatewayPaymentId: p.gatewayPaymentId,
          paidAt: p.paidAt, createdAt: p.createdAt, ledgerEntryId, reconciled: settled === !!ledgerEntryId,
        };
      }),
      meta: { ...createPageMeta(page, total), unreconciledCount: unledgered[0].n },
      summary: summary.map((g) => ({ purpose: g.purpose, status: g.status, count: g._count._all, amountPaise: Number(g._sum.amountPaise ?? 0) })),
    };
  }

  // ---------------------------------------------------------------- cash collections
  const CASH_CATEGORY = { MEMBERSHIP: 'DUES', TICKET: 'TICKETS', MERCH: 'MERCH', FUNDRAISER: 'FUNDRAISER' };

  async function listCashCollections(status, query = {}, collectedById = null) {
    const page = parsePagination(query, { defaultLimit: 50 });
    const where = {
      ...(status && { status: status === 'PENDING' ? 'PENDING_VERIFICATION' : status }),
      ...(collectedById && { collectedById }),
    };
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
      operator: c.collectedBy?.name ?? null,
      payerInfo: c.payer ? `${c.payer.name} / ${c.payer.studentId}` : null,
      amountPaise: Number(c.amountPaise),
      purpose: c.purpose,
      status: c.status === 'PENDING_VERIFICATION' ? 'PENDING' : c.status,
      rejectReason: c.rejectReason,
      recordedAt: c.createdAt,
    }));
    return { data, meta: createPageMeta(page, total) };
  }

  async function createCashCollection(user, input) {
    const row = await prisma.cashCollection.create({
      data: {
        collectedById: user.id,
        purpose: input.purpose,
        refId: input.refId ?? randomUUID(),
        payerUserId: input.payerUserId ?? null,
        amountPaise: BigInt(input.amountPaise),
        status: 'PENDING_VERIFICATION',
      },
    });
    return { id: row.id, status: 'PENDING' };
  }

  // Four-eyes: the collector can't verify their own cash. Verified cash is posted to the ledger in the same tx.
  async function resolveCashCollection(verifier, id, { approve, reason }, req) {
    return prisma.$transaction(async (tx) => {
      const row = await tx.cashCollection.findUnique({ where: { id } });
      if (!row) throw new AppError('NOT_FOUND', 404, 'Cash collection not found');
      if (row.collectedById === verifier.id) throw new AppError('FORBIDDEN', 403, 'You cannot verify cash you collected yourself');
      const { count } = await tx.cashCollection.updateMany({
        where: { id, status: 'PENDING_VERIFICATION' },
        data: { status: approve ? 'VERIFIED' : 'REJECTED', verifiedById: verifier.id, verifiedAt: new Date(), rejectReason: approve ? null : reason },
      });
      if (!count) throw new AppError('INVALID_STATE_TRANSITION', 409, 'This collection was already resolved');
      if (approve) {
        await postIncome({
          category: CASH_CATEGORY[row.purpose], amountPaise: Number(row.amountPaise), sourceType: 'CASH_COLLECTION', sourceId: row.id,
          description: `Cash ${row.purpose.toLowerCase()} collection verified`, recordedBy: verifier.id,
        }, tx);
      }
      await auditLog({ actorId: verifier.id, action: approve ? 'CASH.VERIFY' : 'CASH.REJECT', entityType: 'cash_collection', entityId: id, after: { reason }, req }, tx);
      await notify(tx, {
        userId: row.collectedById, type: 'CASH_RESOLVED',
        title: approve ? 'Cash collection verified' : 'Cash collection rejected',
        body: approve ? `₹${Number(row.amountPaise) / 100} was verified by the Treasurer.` : `₹${Number(row.amountPaise) / 100}: ${reason}`,
        link: '/cash-desk',
      });
      return { id, status: approve ? 'VERIFIED' : 'REJECTED' };
    });
  }

  // ---------------------------------------------------------------- expense claims
  // Routing: STANDARD -> Treasurer (L1). HIGH_VALUE (> ₹2,000) -> Treasurer (L1) then President (L2).
  // TREASURER_SELF -> Mentor, so nobody approves their own spending. Approved claims are paid by the Treasurer.
  const reviewers = (user) => ({
    l1: user.permissions?.includes('claim.review'),
    high: user.permissions?.includes('claim.review.high'),
    self: user.permissions?.includes('claim.review.treasurer'),
    pay: user.permissions?.includes('claim.pay'),
  });
  const isReviewer = (user) => Object.values(reviewers(user)).some(Boolean);

  // Who may act on a claim next, and as what.
  function nextStep(claim, user) {
    if (claim.submittedById === user.id) return null;
    const r = reviewers(user);
    if (claim.status === 'SUBMITTED' && claim.route === 'TREASURER_SELF') return r.self ? { level: 'L1', final: true } : null;
    if (claim.status === 'SUBMITTED') return r.l1 ? { level: 'L1', final: claim.route === 'STANDARD' } : null;
    if (claim.status === 'APPROVED_L1') return r.high ? { level: 'L2', final: true } : null;
    if (claim.status === 'APPROVED') return r.pay ? { level: 'PAY' } : null;
    return null;
  }

  const awaitingWhere = (user) => {
    const r = reviewers(user);
    const or = [];
    if (r.l1) or.push({ status: 'SUBMITTED', route: { in: ['STANDARD', 'HIGH_VALUE'] } });
    if (r.self) or.push({ status: 'SUBMITTED', route: 'TREASURER_SELF' });
    if (r.high) or.push({ status: 'APPROVED_L1' });
    if (r.pay) or.push({ status: 'APPROVED' });
    return { OR: or.length ? or : [{ id: '00000000-0000-0000-0000-000000000000' }], submittedById: { not: user.id } };
  };

  const claimInclude = {
    submittedBy: { select: { id: true, name: true, studentId: true } },
    event: { select: { id: true, title: true, approvedBudgetPaise: true } },
    project: { select: { id: true, name: true } },
    task: { select: { id: true, title: true } },
    receipts: { select: { fileId: true, file: { select: { mime: true } } } },
    decisions: { orderBy: { createdAt: 'asc' }, include: { decider: { select: { name: true } } } },
  };

  const toClaim = (c, user) => ({
    id: c.id,
    submitter: c.submittedBy?.name ?? null,
    user: c.submittedBy,
    amountPaise: Number(c.amountPaise),
    description: c.description,
    category: c.category,
    status: c.status,
    route: c.route,
    eventId: c.eventId,
    projectId: c.projectId,
    link: c.event?.title ?? c.project?.name ?? c.task?.title ?? null,
    dateSpent: c.spentAt,
    createdAt: c.createdAt,
    ageDays: Math.floor((Date.now() - new Date(c.createdAt).getTime()) / (24 * 3600 * 1000)),
    receipts: c.receipts.map((r) => ({ url: `/api/v1/files/${r.fileId}`, mime: r.file.mime })),
    receiptUrls: c.receipts.map((r) => `/api/v1/files/${r.fileId}`),
    decisions: c.decisions.map((d) => ({ level: d.level, decision: d.decision, reason: d.reason, decider: d.decider.name, at: d.createdAt })),
    paidMethod: c.paidMethod, paidReference: c.paidReference, paidAt: c.paidAt,
    nextStep: user ? nextStep(c, user) : null,
  });

  async function listClaims(user, filter = {}) {
    const page = parsePagination(filter, { defaultLimit: 50 });
    const where = filter.mine ? { submittedById: user.id } : filter.awaitingMe === 'true' ? awaitingWhere(user) : {};
    if (filter.status) where.status = filter.status;
    const [rows, total] = await Promise.all([
      prisma.expenseClaim.findMany({ where, include: claimInclude, orderBy: { createdAt: 'desc' }, skip: page.skip, take: page.take }),
      prisma.expenseClaim.count({ where }),
    ]);
    return { data: rows.map((c) => toClaim(c, user)), meta: createPageMeta(page, total) };
  }

  // Submitter or reviewers only; others get 404. Includes the event budget so reviewers see headroom.
  async function getClaim(user, id) {
    const c = await prisma.expenseClaim.findUnique({ where: { id }, include: claimInclude });
    if (!c || (c.submittedById !== user.id && !isReviewer(user))) throw new AppError('NOT_FOUND', 404, 'Claim not found');
    const out = toClaim(c, user);
    if (c.event && isReviewer(user)) out.eventBudget = await eventBudget(prisma, c.event, c.id);
    return out;
  }

  // Approved budget vs money already spent and claims already in the pipeline (excluding `exceptClaimId`).
  async function eventBudget(db, event, exceptClaimId) {
    if (event.approvedBudgetPaise == null) return null;
    const [spent, committed] = await Promise.all([
      eventSpend(db, event.id),
      db.expenseClaim.aggregate({ where: { eventId: event.id, id: { not: exceptClaimId }, status: { in: ['APPROVED_L1', 'APPROVED'] } }, _sum: { amountPaise: true } }),
    ]);
    const approvedPaise = Number(event.approvedBudgetPaise);
    const committedPaise = Number(committed._sum.amountPaise ?? 0);
    return { approvedPaise, spentPaise: spent, committedPaise, remainingPaise: approvedPaise - spent - committedPaise };
  }

  async function submitClaim(user, input) {
    const links = [input.eventId, input.projectId, input.taskId].filter(Boolean);
    if (!links.length) throw new AppError('VALIDATION_ERROR', 400, 'Link the claim to an event, project or task');
    if (input.eventId && !(await prisma.event.findUnique({ where: { id: input.eventId }, select: { id: true } }))) {
      throw new AppError('VALIDATION_ERROR', 422, 'Unknown event');
    }
    const route = user.roles?.includes('TREASURER') ? 'TREASURER_SELF' : input.amountPaise > HIGH_VALUE_PAISE ? 'HIGH_VALUE' : 'STANDARD';
    const receiptFileIds = input.receiptFileIds ?? [];
    const claim = await prisma.$transaction(async (tx) => {
      if (receiptFileIds.length) await files.assertUsable(receiptFileIds, { ownerId: user.id, purpose: 'RECEIPT' }, tx);
      const row = await tx.expenseClaim.create({
        data: {
          submittedById: user.id,
          amountPaise: BigInt(input.amountPaise),
          category: input.category,
          description: input.description,
          spentAt: new Date(input.dateSpent),
          eventId: input.eventId ?? null,
          projectId: input.projectId ?? null,
          taskId: input.taskId ?? null,
          route,
          status: 'SUBMITTED',
          receipts: { create: receiptFileIds.map((fileId) => ({ fileId })) },
        },
      });
      if (receiptFileIds.length) await files.attach(receiptFileIds, { type: 'expense_claim', id: row.id }, tx);
      const roles = route === 'TREASURER_SELF' ? ['MENTOR'] : ['TREASURER'];
      const people = await tx.roleAssignment.findMany({ where: { role: { in: roles }, endedAt: null }, select: { userId: true } });
      await notifyMany(tx, people.map((p) => p.userId).filter((id) => id !== user.id), {
        type: 'CLAIM_SUBMITTED', title: 'Expense claim to review',
        body: `${user.name ?? 'A volunteer'} claimed ₹${input.amountPaise / 100}: ${input.description}`,
        link: `/manage/claims/${row.id}`,
      });
      return row;
    });
    return { id: claim.id, status: claim.status, route };
  }

  async function reviewClaim(user, id, { decision, reason }, req) {
    if (!['APPROVE', 'REJECT'].includes(decision)) throw new AppError('VALIDATION_ERROR', 400, 'decision must be APPROVE or REJECT');
    if (decision === 'REJECT' && !reason?.trim()) throw new AppError('VALIDATION_ERROR', 400, 'A reason is required to reject a claim');
    return prisma.$transaction(async (tx) => {
      const claim = await tx.expenseClaim.findUnique({ where: { id }, include: { event: true } });
      if (!claim || (claim.submittedById !== user.id && !isReviewer(user))) throw new AppError('NOT_FOUND', 404, 'Claim not found');
      if (claim.submittedById === user.id) throw new AppError('FORBIDDEN', 403, 'You cannot review your own claim');
      const step = nextStep(claim, user);
      if (!step || step.level === 'PAY') throw new AppError('INVALID_STATE_TRANSITION', 409, `This claim is ${claim.status.toLowerCase().replaceAll('_', ' ')} and is not awaiting your review`);

      // An event's approved budget is a hard cap on what can be approved against it.
      if (decision === 'APPROVE' && claim.event) {
        const budget = await eventBudget(tx, claim.event, claim.id);
        if (budget && Number(claim.amountPaise) > budget.remainingPaise) {
          throw new AppError('EVENT_BUDGET_EXCEEDED', 409, `This claim exceeds the remaining budget for "${claim.event.title}" (₹${Math.max(0, budget.remainingPaise) / 100} left)`);
        }
      }
      const status = decision === 'REJECT' ? 'REJECTED' : step.final ? 'APPROVED' : 'APPROVED_L1';
      const { count } = await tx.expenseClaim.updateMany({ where: { id, status: claim.status }, data: { status } });
      if (!count) throw new AppError('INVALID_STATE_TRANSITION', 409, 'This claim changed while you were reviewing it');
      await tx.claimDecision.create({ data: { claimId: id, deciderId: user.id, level: step.level, decision, reason: reason?.trim() || null } });
      await auditLog({ actorId: user.id, action: `CLAIM.${decision}`, entityType: 'expense_claim', entityId: id, after: { status, reason }, req }, tx);
      await notify(tx, {
        userId: claim.submittedById, type: 'CLAIM_REVIEWED',
        title: status === 'REJECTED' ? 'Expense claim rejected' : status === 'APPROVED' ? 'Expense claim approved' : 'Expense claim passed first review',
        body: status === 'REJECTED' ? reason.trim() : status === 'APPROVED' ? 'The Treasurer will reimburse you shortly.' : 'It now needs the President’s approval.',
        link: `/volunteer/claims/${id}`,
      });
      if (status === 'APPROVED_L1') {
        const presidents = await tx.roleAssignment.findMany({ where: { role: 'PRESIDENT', endedAt: null }, select: { userId: true } });
        await notifyMany(tx, presidents.map((p) => p.userId), { type: 'CLAIM_SUBMITTED', title: 'High-value claim to approve', body: claim.description, link: `/manage/claims/${id}` });
      }
      return { id, status };
    });
  }

  // Reimbursement: APPROVED -> PAID, with the ledger OUT entry (tagged to the event/project) in the same tx.
  async function payClaim(user, id, { method, reference }, req) {
    return prisma.$transaction(async (tx) => {
      const claim = await tx.expenseClaim.findUnique({ where: { id } });
      if (!claim) throw new AppError('NOT_FOUND', 404, 'Claim not found');
      if (claim.submittedById === user.id) throw new AppError('FORBIDDEN', 403, 'You cannot pay out your own claim');
      const { count } = await tx.expenseClaim.updateMany({
        where: { id, status: 'APPROVED' },
        data: { status: 'PAID', paidMethod: method, paidReference: reference, paidAt: new Date() },
      });
      if (!count) throw new AppError('INVALID_STATE_TRANSITION', 409, 'Only approved claims can be paid');
      await postExpense({
        category: claim.category, amountPaise: Number(claim.amountPaise), sourceType: 'CLAIM', sourceId: claim.id,
        eventId: claim.eventId, projectId: claim.projectId, description: `Claim reimbursement: ${claim.description}`, recordedBy: user.id,
      }, tx);
      await auditLog({ actorId: user.id, action: 'CLAIM.PAY', entityType: 'expense_claim', entityId: id, after: { method, reference }, req }, tx);
      await notify(tx, { userId: claim.submittedById, type: 'CLAIM_PAID', title: 'Reimbursement paid', body: `₹${Number(claim.amountPaise) / 100} via ${method} (ref ${reference}).`, link: `/volunteer/claims/${id}` });
      return { id, status: 'PAID' };
    });
  }

  return {
    list, balance, get, createManual, reverse, allocate, listAllocations, setLimits, utilization,
    budgetOverview, reportSummary, listPayments, listCashCollections, createCashCollection, resolveCashCollection,
    listClaims, getClaim, submitClaim, reviewClaim, payClaim,
  };
}
