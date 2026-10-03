import { sealQr, openQr } from '../../lib/qrToken.js';
import { notify } from '../../lib/notify.js';
import { AppError } from '../../lib/AppError.js';
import { createPageMeta, parsePagination } from '../../lib/pagination.js';
import { auditLog } from '../../utils/audit.js';
import { registerPurposeHandler } from '../payments/payments.service.js';

const DAY = 24 * 60 * 60 * 1000;
const IST_END_OF_DAY = 'T23:59:59+05:30'; // club dates end at 23:59:59 IST

// Expiry is lazy: nothing flips ACTIVE -> LAPSED on a timer, we just read it that way.
const effectiveStatus = (m, now = new Date()) => (m.status === 'ACTIVE' && m.expiresAt < now ? 'LAPSED' : m.status);

const toPublic = (m) => ({
  id: m.id, tierId: m.tierId, tierName: m.tier?.name, status: effectiveStatus(m), source: m.source,
  startsAt: m.startsAt, expiresAt: m.expiresAt, createdAt: m.createdAt,
});
const tierPublic = (t) => ({ id: t.id, name: t.name, pricePaise: Number(t.pricePaise), durationType: t.durationType, benefits: t.benefits });

// Settings belong to Person B's module; read the row if it exists, else use the documented default.
async function setting(db, key, fallback) {
  const row = await db.setting.findUnique({ where: { key } });
  return row ? row.value : fallback;
}

// First occurrence of `MM-DD` (club.academicYearEnd, default 05-31) strictly after `from`.
function nextYearEnd(from, mmdd) {
  for (let y = from.getUTCFullYear(); ; y += 1) {
    const d = new Date(`${y}-${mmdd}${IST_END_OF_DAY}`);
    if (d > from) return d;
  }
}
// Semester ends Dec 31 (Jul-Dec) or Jun 30 (Jan-Jun).
function semesterEnd(from) {
  const ist = new Date(from.getTime() + 5.5 * 3600 * 1000);
  const month = ist.getUTCMonth(); // 0-based
  return new Date(`${ist.getUTCFullYear()}-${month >= 6 ? '12-31' : '06-30'}${IST_END_OF_DAY}`);
}

const QR = /^m:([0-9a-f-]{36}):(\d+)$/;

export function createMembershipsService({ prisma, config }) {
  // ---------------------------------------------------------------- payment hooks
  // Runs INSIDE the payment webhook transaction (payments registers it for purpose MEMBERSHIP).
  // payments already posted the ledger DUES entry, so nothing is posted here.
  registerPurposeHandler(
    'MEMBERSHIP',
    async (payment, tx) => {
      const m = await tx.membership.findUnique({ where: { id: payment.refId }, include: { tier: true } });
      if (!m || m.status !== 'PENDING') return; // already handled
      const now = new Date();
      // Renewal: the new term starts when the current one ends; the old row is superseded
      // (the DB allows only one ACTIVE membership per user).
      const prev = await tx.membership.findFirst({ where: { userId: m.userId, status: 'ACTIVE', id: { not: m.id } } });
      const startsAt = prev?.expiresAt > now ? prev.expiresAt : now;
      if (prev) await tx.membership.update({ where: { id: prev.id }, data: { status: 'LAPSED' } });
      const expiresAt =
        m.tier.durationType === 'SEMESTER' ? semesterEnd(startsAt) : nextYearEnd(startsAt, await setting(tx, 'club.academicYearEnd', '05-31'));
      await tx.membership.update({ where: { id: m.id }, data: { status: 'ACTIVE', startsAt, expiresAt, paymentId: payment.id } });
      await notify(tx, {
        userId: m.userId,
        type: 'MEMBERSHIP_ACTIVE',
        title: 'Welcome to Skyline',
        body: `Your ${m.tier.name} is active until ${expiresAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })}.`,
        link: '/me/membership',
      });
    },
    {
      onFailed: (payment, tx) => tx.membership.updateMany({ where: { id: payment.refId, status: 'PENDING' }, data: { status: 'CANCELLED' } }),
    },
  );

  // ---------------------------------------------------------------- tiers
  async function listTiers() {
    return (await prisma.membershipTier.findMany({ where: { isActive: true }, orderBy: { pricePaise: 'asc' } })).map(tierPublic);
  }

  // ponytail: price changes should go through approvals (TIER_PRICE); that arrives in Phase 5.
  async function createTier(actor, body, req) {
    return prisma.$transaction(async (tx) => {
      const t = await tx.membershipTier
        .create({ data: { name: body.name, pricePaise: BigInt(body.pricePaise), durationType: body.durationType, benefits: body.benefits ?? {} } })
        .catch((e) => { throw e.code === 'P2002' ? new AppError('ALREADY_EXISTS', 409, 'A tier with this name already exists') : e; });
      await auditLog({ actorId: actor.id, action: 'MEMBERSHIP.TIER_CREATE', entityType: 'membership_tier', entityId: t.id, after: tierPublic(t), req }, tx);
      return tierPublic(t);
    });
  }

  async function updateTier(actor, id, body, req) {
    return prisma.$transaction(async (tx) => {
      const before = await tx.membershipTier.findUnique({ where: { id } });
      if (!before) throw new AppError('NOT_FOUND', 404, 'Tier not found');
      const { pricePaise, ...rest } = body;
      const t = await tx.membershipTier
        .update({ where: { id }, data: { ...rest, ...(pricePaise !== undefined && { pricePaise: BigInt(pricePaise) }) } })
        .catch((e) => { throw e.code === 'P2002' ? new AppError('ALREADY_EXISTS', 409, 'A tier with this name already exists') : e; });
      await auditLog({ actorId: actor.id, action: 'MEMBERSHIP.TIER_UPDATE', entityType: 'membership_tier', entityId: id, before: tierPublic(before), after: tierPublic(t), req }, tx);
      return tierPublic(t);
    });
  }

  // ---------------------------------------------------------------- my membership
  async function me(userId) {
    const rows = await prisma.membership.findMany({
      where: { userId },
      include: {
        tier: true,
        user: { select: { id: true, name: true, email: true, studentId: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    const all = rows.map((m) => ({
      ...toPublic(m),
      user: m.user,
      tier: m.tier ? tierPublic(m.tier) : undefined,
      validUntil: m.expiresAt,
    }));
    const current = all.find((m) => m.status === 'ACTIVE') || all[0] || null;
    return {
      current,
      history: all.filter((m) => m.id !== current?.id),
      ...(current || {}),
    };
  }

  // Contract function (merch, announcements, ...): is this user an active member right now?
  async function isActiveMember(userId) {
    return !!(await prisma.membership.findFirst({ where: { userId, status: 'ACTIVE', expiresAt: { gte: new Date() } }, select: { id: true } }));
  }

  // ---------------------------------------------------------------- checkout
  // Needs createPayment from the payments service (passed in so there is one payments instance).
  async function checkout(user, { tierId }, idempotencyKey, createPayment) {
    if (!idempotencyKey) throw new AppError('IDEMPOTENCY_KEY_REQUIRED', 400, 'Idempotency-Key header is required');
    if (user.emailVerified === false) throw new AppError('EMAIL_NOT_VERIFIED', 403, 'Verify your email first');
    const key = `${user.id}:${idempotencyKey}`; // per-user, so one user's key can never replay another's payment

    const prior = await prisma.payment.findUnique({ where: { idempotencyKey: key } });
    if (prior) return createPayment({ userId: user.id, purpose: 'MEMBERSHIP', refId: prior.refId, amountPaise: Number(prior.amountPaise), idempotencyKey: key });

    const tier = await prisma.membershipTier.findUnique({ where: { id: tierId } });
    if (!tier?.isActive) throw new AppError('NOT_FOUND', 404, 'Tier not found');

    // Already a member? Only allowed to buy again inside the renewal window.
    const windowDays = await setting(prisma, 'membership.renewalWindowDays', 30);
    const active = await prisma.membership.findFirst({ where: { userId: user.id, status: 'ACTIVE', expiresAt: { gt: new Date() } } });
    if (active && active.expiresAt.getTime() - Date.now() > windowDays * DAY) {
      throw new AppError('ALREADY_ACTIVE', 409, 'You already have an active membership');
    }

    const m = await prisma.membership.create({ data: { userId: user.id, tierId, source: 'ONLINE' } }); // PENDING
    try {
      const result = await createPayment({ userId: user.id, purpose: 'MEMBERSHIP', refId: m.id, amountPaise: Number(tier.pricePaise), idempotencyKey: key });
      await prisma.membership.update({ where: { id: m.id }, data: { paymentId: result.paymentId } });
      return result;
    } catch (e) {
      await prisma.membership.delete({ where: { id: m.id } }); // gateway failed: don't leave a dangling PENDING row
      throw e;
    }
  }

  // ---------------------------------------------------------------- card QR
  function cardSecret() {
    if (!config.cardQrSecret) throw new AppError('NOT_CONFIGURED', 503, 'Membership cards are not configured');
    return config.cardQrSecret;
  }
  const qrFor = (userId, version) => sealQr(cardSecret(), `m:${userId}:${version}`);

  async function activeOf(userId) {
    const m = await prisma.membership.findFirst({ where: { userId, status: 'ACTIVE' }, include: { tier: true } });
    if (!m || effectiveStatus(m) !== 'ACTIVE') throw new AppError('NOT_A_MEMBER', 403, 'An active membership is required');
    return m;
  }

  async function card(userId) {
    const m = await activeOf(userId);
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } }); // users module is Person B's
    return { qr: qrFor(userId, m.cardSecretVersion), name: user.name, tierName: m.tier.name, expiresAt: m.expiresAt, status: 'ACTIVE' };
  }

  // Lost phone: bump the version so every old QR stops verifying.
  async function rotate(userId) {
    const m = await activeOf(userId);
    const updated = await prisma.membership.update({ where: { id: m.id }, data: { cardSecretVersion: { increment: 1 } } });
    return { qr: qrFor(userId, updated.cardSecretVersion) };
  }

  // Returns only name + status. The token is decrypted first, so a forged QR never reaches the database.
  async function verify({ qr }) {
    const parts = QR.exec(openQr(cardSecret(), qr) ?? '');
    if (!parts) return { result: 'INVALID' };
    const [, userId, version] = parts;
    const m = await prisma.membership.findFirst({ where: { userId, status: 'ACTIVE' }, include: { user: { select: { name: true } } } });
    if (!m || m.cardSecretVersion !== Number(version)) return { result: 'INVALID' }; // rotated or never a member
    return { result: effectiveStatus(m) === 'ACTIVE' ? 'VALID' : 'LAPSED', name: m.user.name, expiresAt: m.expiresAt };
  }

  // ---------------------------------------------------------------- renewal reminders
  // Treasurer action: remind members whose dues expire soon, and people who started checkout
  // but never paid. Anyone reminded in the last 7 days is skipped so repeat clicks don't spam.
  // Emails are queued in EmailOutbox for the mail worker; in-app notifications appear immediately.
  async function remindExpiring({ withinDays = 30 } = {}) {
    const now = new Date();
    const [expiring, pending, recent] = await Promise.all([
      prisma.membership.findMany({
        where: { status: 'ACTIVE', expiresAt: { gte: now, lte: new Date(now.getTime() + withinDays * DAY) } },
        include: { tier: true, user: { select: { email: true, name: true } } },
      }),
      prisma.membership.findMany({
        where: { status: 'PENDING' },
        include: { tier: true, user: { select: { email: true, name: true } } },
      }),
      prisma.notification.findMany({
        where: { type: 'RENEWAL_REMINDER', createdAt: { gte: new Date(now.getTime() - 7 * DAY) } },
        select: { userId: true },
      }),
    ]);
    const skip = new Set(recent.map((n) => n.userId));
    const fmt = (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
    const targets = new Map(); // userId -> reminder; one per user even if they match both lists
    for (const m of expiring) {
      if (!skip.has(m.userId)) targets.set(m.userId, { m, body: `Your ${m.tier.name} expires on ${fmt(m.expiresAt)}. Renew to keep your member benefits.` });
    }
    for (const m of pending) {
      if (!skip.has(m.userId) && !targets.has(m.userId)) targets.set(m.userId, { m, body: `Your ${m.tier.name} payment is still pending. Complete it to activate your membership.` });
    }
    const list = [...targets.entries()];
    await prisma.$transaction([
      prisma.notification.createMany({
        data: list.map(([userId, { body }]) => ({ userId, type: 'RENEWAL_REMINDER', title: 'Membership renewal', body, link: '/join' })),
      }),
      prisma.emailOutbox.createMany({
        data: list.map(([, { m, body }]) => ({ to: m.user.email, template: 'membership_renewal', payload: { name: m.user.name, message: body, link: '/join' } })),
      }),
    ]);
    return { reminded: list.length, expiring: expiring.length, pending: pending.length, skippedRecentlyReminded: expiring.length + pending.length - list.length };
  }

  // ---------------------------------------------------------------- admin list + stats
  // Status filters use the lazy rule: ACTIVE means stored ACTIVE and not yet expired.
  function statusWhere(status, now) {
    if (status === 'ACTIVE') return { status: 'ACTIVE', expiresAt: { gte: now } };
    if (status === 'LAPSED') return { OR: [{ status: 'LAPSED' }, { status: 'ACTIVE', expiresAt: { lt: now } }] };
    return status ? { status } : {};
  }

  async function list(q) {
    const page = parsePagination(q);
    const now = new Date();
    const where = {
      ...statusWhere(q.status, now),
      ...(q.tierId && { tierId: q.tierId }),
      ...(q.expiringWithinDays && { status: 'ACTIVE', expiresAt: { gte: now, lte: new Date(now.getTime() + q.expiringWithinDays * DAY) } }),
    };
    const [rows, total] = await Promise.all([
      prisma.membership.findMany({ where, include: { tier: true, user: { select: { name: true, studentId: true } } }, orderBy: { createdAt: 'desc' }, skip: page.skip, take: page.take }),
      prisma.membership.count({ where }),
    ]);
    // Limited fields only: no email or phone in lists.
    const data = rows.map((m) => ({ ...toPublic(m), userId: m.userId, name: m.user.name, studentId: m.user.studentId }));
    return { data, meta: createPageMeta(page, total) };
  }

  async function stats() {
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const activeWhere = statusWhere('ACTIVE', now);
    const [active, lapsed, pending, newThisMonth, renewalsDue30d, byTierRows, trend] = await Promise.all([
      prisma.membership.count({ where: activeWhere }),
      prisma.membership.count({ where: statusWhere('LAPSED', now) }),
      prisma.membership.count({ where: { status: 'PENDING' } }),
      prisma.membership.count({ where: { status: { in: ['ACTIVE', 'LAPSED'] }, startsAt: { gte: monthStart } } }),
      prisma.membership.count({ where: { status: 'ACTIVE', expiresAt: { gte: now, lte: new Date(now.getTime() + 30 * DAY) } } }),
      prisma.membership.groupBy({ by: ['tierId'], where: activeWhere, _count: { _all: true } }),
      prisma.$queryRaw`
        SELECT to_char(date_trunc('month', starts_at AT TIME ZONE 'Asia/Kolkata'), 'YYYY-MM') AS month, COUNT(*)::int AS count
        FROM memberships
        WHERE status IN ('ACTIVE', 'LAPSED') AND starts_at >= (now() - interval '6 months')
        GROUP BY 1 ORDER BY 1`,
    ]);
    const tiers = new Map((await prisma.membershipTier.findMany()).map((t) => [t.id, t.name]));
    return {
      active, lapsed, pending, newThisMonth, renewalsDue30d,
      byTier: byTierRows.map((r) => ({ tier: tiers.get(r.tierId), count: r._count._all })),
      monthlyTrend: trend,
    };
  }

  return { listTiers, createTier, updateTier, me, isActiveMember, checkout, card, rotate, verify, list, stats, remindExpiring };
}
