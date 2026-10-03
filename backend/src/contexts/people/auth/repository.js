import { buildAccessClaims } from './claims.js';

export const profileSelect = { id: true, name: true, email: true, studentId: true, phone: true,
  avatarFileId: true, emailVerifiedAt: true, isDisabled: true, createdAt: true };

export async function membershipFor(tx, userId) {
  const rows = await tx.$queryRaw`SELECT status, active_since, expires_at FROM commerce.v_member_status WHERE user_id = ${userId}::uuid LIMIT 1`;
  const row = rows[0];
  if (!row) return { status: 'NONE' };
  return { status: row.status === 'CANCELLED' ? 'LAPSED' : row.status,
    ...(row.active_since ? { activeSince: row.active_since.toISOString() } : {}),
    ...(row.expires_at ? { expiresAt: row.expires_at.toISOString() } : {}) };
}

export async function claimsFor(tx, user, now = new Date()) {
  const [membership, assignments, volunteer] = await Promise.all([
    membershipFor(tx, user.id), tx.roleAssignment.findMany({ where: { userId: user.id } }),
    tx.volunteer.findUnique({ where: { userId: user.id } }),
  ]);
  return buildAccessClaims({ user, membership, assignments, isVolunteer: volunteer?.status === 'ACTIVE', now });
}

export function mePayload(user, claims) {
  return { ...claims, id: user.id, email: user.email, studentId: user.studentId, phone: user.phone,
    avatarFileId: user.avatarFileId, avatarUrl: user.avatarFileId ? `/api/v1/files/${user.avatarFileId}` : null };
}

export async function revokeSessions(tx, userId, reason = 'ADMIN_REVOKED') {
  return tx.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date(), revokeReason: reason } });
}
