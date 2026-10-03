import { z } from 'zod';
import { termRoleSchema } from '../auth/claims.js';

const id = z.uuid();
const text = z.string().min(1);
const date = z.iso.datetime({ offset: true });
const money = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const role = termRoleSchema;
const object = (shape) => z.object(shape).strict();
const door = object({ userId: id, eventId: id, eventTitle: text, validFrom: date, validTo: date });
const order = object({ orderId: id, userId: id, totalPaise: money });
const price = { approvalId: id, type: z.enum(['MERCH_PRICE', 'TIER_PRICE']), targetName: text, requestedBy: id };

// Version 1 payloads are the shared contracts in boundaries sections 7.2–7.4.
export const eventCatalog = Object.freeze({
  'commerce.membership.activated': object({ userId: id, membershipId: id, tierName: text, expiresAt: date }),
  'commerce.membership.expiring': object({ userId: id, expiresAt: date, daysLeft: z.number().int().nonnegative() }),
  'commerce.membership.lapsed': object({ userId: id }),
  'commerce.ticket.issued': object({ userId: id, eventId: id, eventTitle: text, ticketIds: z.array(id).min(1) }),
  'commerce.ticket.refunded': object({ userId: id, eventId: id, eventTitle: text, ticketId: id, amountPaise: money }),
  'commerce.event.published': object({ eventId: id, title: text, startAt: date }),
  'commerce.event.changed': object({ eventId: id, title: text, changes: object({ startAt: date.optional(), endAt: date.optional(), venue: text.optional() }).refine((changes) => Object.keys(changes).length > 0) }),
  'commerce.event.cancelled': object({ eventId: id, title: text, reason: text }),
  'commerce.event.review.decided': object({ eventId: id, title: text, proposerId: id, decision: z.enum(['APPROVE', 'REQUEST_CHANGES', 'REJECT']), comment: text.optional() }),
  'commerce.event.review.requested': object({ eventId: id, title: text, proposerId: id }),
  'commerce.door.assigned': door,
  'commerce.door.revoked': door,
  'commerce.order.paid': order,
  'commerce.order.ready': order,
  'commerce.order.refunded': order,
  'commerce.claim.submitted': object({ claimId: id, submitterId: id, amountPaise: money, awaitingRole: role }),
  'commerce.claim.decided': object({ claimId: id, submitterId: id, decision: z.enum(['APPROVE', 'REJECT']), reason: text.optional(), nextAwaitingRole: role.optional() }),
  'commerce.claim.paid': object({ claimId: id, submitterId: id, amountPaise: money, method: z.enum(['CASH', 'BANK', 'UPI']) }),
  'commerce.cash.rejected': object({ collectionId: id, collectorId: id, reason: text }),
  'commerce.price.requested': object(price),
  'commerce.price.decided': object({ ...price, decision: z.enum(['APPROVE', 'REJECT']) }),
  'people.user.disabled': object({ userId: id }),
  'people.volunteer.deactivated': object({ userId: id }),
  'people.project.closed': object({ projectId: id }),
  'people.role.ended': object({ userId: id }),
});

export function parseEventPayload(type, payload, version = 1) {
  if (version !== 1 || !Object.hasOwn(eventCatalog, type)) {
    throw new Error(`Unknown event contract: ${type}@${version}`);
  }
  return eventCatalog[type].parse(payload);
}

export const eventEnvelopeSchema = object({
  id,
  type: text,
  version: z.literal(1),
  occurredAt: date,
  actorId: id.nullable(),
  payload: z.unknown(),
}).superRefine((envelope, context) => {
  if (!Object.hasOwn(eventCatalog, envelope.type)) {
    context.addIssue({ code: 'custom', path: ['type'], message: 'Unknown event type' });
    return;
  }
  const result = eventCatalog[envelope.type].safeParse(envelope.payload);
  if (!result.success) {
    for (const issue of result.error.issues) context.addIssue({ ...issue, path: ['payload', ...issue.path] });
  }
});
