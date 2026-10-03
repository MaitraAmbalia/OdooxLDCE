import { isIP } from 'node:net';

/**
 * Records administrative or sensitive system actions to the append-only audit_logs table.
 */
export async function auditLog({ actorId, action, entityType, entityId, before, after, req }, tx) {
  if (!tx?.auditLog) return;
  await tx.auditLog.create({
    data: {
      actorId: actorId ?? null,
      action,
      entityType,
      entityId: entityId ?? null,
      before: before ?? undefined,
      after: after ?? undefined,
      ipAddress: req?.ip && isIP(req.ip) ? req.ip : null,
    },
  });
}
