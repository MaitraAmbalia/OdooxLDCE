import { randomUUID } from 'node:crypto';
import { parseEventPayload, eventEnvelopeSchema, eventCatalog } from './catalog.js';
import { transaction } from '../db/clients.js';

export async function publish(tx, type, payload, { actorId = null } = {}) {
  const id = randomUUID();
  const parsed = parseEventPayload(type, payload);
  await tx.$executeRaw`INSERT INTO platform.outbox (id, type, version, actor_id, payload)
    VALUES (${id}::uuid, ${type}, 1, ${actorId}::uuid, ${JSON.stringify(parsed)}::jsonb)`;
  return id;
}

export function subscribe(type, consumerName, handler, { context = 'people' } = {}) {
  if (!Object.hasOwn(eventCatalog, type)) throw new Error('Unknown event type');
  return { type, consumerName, handler, context, queue: `event.${consumerName}` };
}

export async function handleOnce(client, subscriber, event) {
  const envelope = eventEnvelopeSchema.parse(event);
  if (envelope.type !== subscriber.type) throw new Error('Subscriber event type mismatch');
  return transaction(client, async (tx) => {
    // The receipt and handler writes commit together, including on repeated delivery.
    const inserted = await tx.$executeRaw`INSERT INTO platform.processed_events (consumer, event_id)
      VALUES (${subscriber.consumerName}, ${envelope.id}::uuid) ON CONFLICT DO NOTHING`;
    if (!inserted) return false;
    await subscriber.handler(tx, envelope);
    return true;
  });
}

export async function dispatchOutbox(platform, boss, subscribers) {
  return transaction(platform, async (tx) => {
    const rows = await tx.$queryRaw`SELECT * FROM platform.outbox WHERE dispatched_at IS NULL
      ORDER BY occurred_at LIMIT 100 FOR UPDATE SKIP LOCKED`;
    for (const row of rows) {
      const envelope = { id: row.id, type: row.type, version: row.version,
        actorId: row.actor_id, occurredAt: row.occurred_at.toISOString(), payload: row.payload };
      for (const subscriber of subscribers.filter((candidate) => candidate.type === row.type)) {
        // Queueing may repeat after a dispatcher crash; handleOnce prevents repeated writes.
        await boss.send(subscriber.queue, envelope, { singletonKey: `${subscriber.consumerName}:${row.id}` });
      }
      await tx.$executeRaw`UPDATE platform.outbox SET dispatched_at = now() WHERE id = ${row.id}::uuid`;
    }
    return rows.length;
  });
}
