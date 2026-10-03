import { isIP } from 'node:net';

/**
 * DEV STAND-INS for pieces owned by Person B. Delete/replace when the real ones land.
 */

/**
 * Stub for B's audit.log({ actorId, action, entityType, entityId, before, after, req }, tx).
 * Writes straight to audit_logs (append-only table) inside the caller's transaction.
 * BigInt-free: callers pass already-serialised (Number) payloads.
 */
export async function auditLog({ actorId, action, entityType, entityId, before, after, req }, tx) {
  await tx.auditLog.create({
    data: {
      actorId: actorId ?? null,
      action,
      entityType,
      entityId: entityId ?? null,
      before: before ?? undefined,
      after: after ?? undefined,
      ipAddress: req?.ip && isIP(req.ip) ? req.ip : null, // column is Postgres inet
      requestId: req?.id ?? null,
    },
  });
}
