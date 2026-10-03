import { randomUUID } from 'node:crypto';

export async function audit(tx, { actorId = null, action, entityType, entityId = null, details = {}, requestId = null }) {
  // No foreign key to either business context. Same transaction as privileged writes.
  const id = randomUUID();
  await tx.$executeRaw`INSERT INTO platform.audit_logs
    (id, actor_id, action, entity_type, entity_id, details, request_id)
    VALUES (${id}::uuid, ${actorId}::uuid, ${action}, ${entityType}, ${entityId}::uuid, ${JSON.stringify(details)}::jsonb, ${requestId})`;
  return id;
}
