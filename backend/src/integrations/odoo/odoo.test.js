import assert from 'node:assert/strict';
import test from 'node:test';
import { createOdooClient } from './odoo.client.js';
import { createOdooService } from './odoo.service.js';

const config = {
  odooEnabled: true,
  odooUrl: 'http://odoo.test',
  odooWebUrl: 'http://odoo.test',
  odooDatabase: 'skyline_odoo',
  odooUsername: 'integration@skyline.local',
  odooPassword: 'secret',
  odooTimeoutMs: 1000,
};

test('Odoo client authenticates once and executes model calls with server-side credentials', async () => {
  const calls = [];
  const fetchImpl = async (_url, options) => {
    const body = JSON.parse(options.body);
    calls.push(body);
    return {
      ok: true,
      async json() {
        return { jsonrpc: '2.0', id: body.id, result: body.params.service === 'common' ? 7 : 3 };
      },
    };
  };
  const client = createOdooClient({ config, fetchImpl });

  assert.equal(await client.execute('crm.lead', 'search_count', [[]]), 3);
  assert.equal(await client.execute('crm.lead', 'search_count', [[]]), 3);
  assert.equal(calls.filter((call) => call.params.service === 'common').length, 1);
  assert.deepEqual(calls[1].params.args.slice(0, 3), ['skyline_odoo', 7, 'secret']);
  assert.equal(calls[1].params.args[3], 'crm.lead');
});

test('Odoo client refuses to operate while the integration is disabled', async () => {
  const client = createOdooClient({ config: { ...config, odooEnabled: false } });
  await assert.rejects(() => client.authenticate(), (error) => error.code === 'ODOO_NOT_CONFIGURED');
});

test('Treasurer receipt posts to the existing sponsorship ledger using the authenticated subject', async () => {
  const actorId = '11111111-1111-4111-8111-111111111111';
  let insertedEntry;
  let insertedAudit;
  const event = {
    id: '22222222-2222-4222-8222-222222222222',
    title: 'Demo Day',
    venue: 'Auditorium',
    startAt: new Date('2026-11-01T10:00:00.000Z'),
    status: 'PUBLISHED',
    sponsorshipRequired: true,
    sponsorshipTargetPaise: 100000n,
    sponsorshipDeadline: new Date('2026-10-20T10:00:00.000Z'),
    sponsorshipPitch: 'Support student builders.',
    sponsorshipPackages: ['Gold'],
    sponsorBenefits: 'Brand placement',
  };
  const prisma = {
    event: { findUnique: async () => event },
    ledgerEntry: { findMany: async () => [] },
    $transaction: async (callback) => callback({
      ledgerEntry: {
        createMany: async ({ data }) => {
          [insertedEntry] = data;
          return { count: 1 };
        },
        findFirst: async () => ({ id: 'entry-1', ...insertedEntry }),
      },
      auditLog: {
        create: async ({ data }) => {
          insertedAudit = data;
          return data;
        },
      },
    }),
  };
  const client = {
    execute: async (model, method) => {
      if (model === 'utm.campaign' && method === 'search_read') return [{ id: 44, name: '[SKYLINE:event] Demo Day' }];
      if (model === 'crm.lead' && method === 'read') {
        return [{
          id: 73,
          name: 'Example Sponsor - Gold',
          partner_id: [9, 'Example Sponsor'],
          expected_revenue: 1000,
          probability: 100,
          stage_id: [4, 'Won'],
          campaign_id: [44, '[SKYLINE:event] Demo Day'],
        }];
      }
      throw new Error(`Unexpected Odoo call: ${model}.${method}`);
    },
  };
  const service = createOdooService({ prisma, client });

  const result = await service.recordReceipt(event.id, 73, {
    amountReceivedPaise: 25000,
    receivedAt: new Date('2026-10-04T10:00:00.000Z'),
    paymentReference: ' utr-001 ',
    note: 'First instalment',
  }, { sub: actorId }, { ip: '127.0.0.1' });

  assert.equal(result.amountPaise, 25000);
  assert.equal(result.duplicate, false);
  assert.equal(insertedEntry.recordedById, actorId);
  assert.equal(insertedEntry.category, 'SPONSORSHIP');
  assert.match(insertedEntry.description, /\[ODOO_LEAD:73\]/);
  assert.equal(insertedAudit.actorId, actorId);
  assert.equal(insertedAudit.action, 'SPONSORSHIP.RECEIPT_RECORDED');
});

test('Won sponsorships are marked done and notify Treasurer and Mentor idempotently', async () => {
  const event = {
    id: '22222222-2222-4222-8222-222222222222',
    title: 'Demo Day',
    venue: 'Auditorium',
    startAt: new Date('2026-11-01T10:00:00.000Z'),
    status: 'PUBLISHED',
    sponsorshipRequired: true,
    sponsorshipTargetPaise: 100000n,
    sponsorshipDeadline: new Date('2026-10-20T10:00:00.000Z'),
    sponsorshipPitch: 'Support student builders.',
    sponsorshipPackages: ['Gold'],
    sponsorBenefits: 'Brand placement',
  };
  const notificationWrites = [];
  const prisma = {
    event: { findUnique: async () => event },
    ledgerEntry: { findMany: async () => [] },
    roleAssignment: {
      findMany: async () => [
        { userId: '11111111-1111-4111-8111-111111111111' },
        { userId: '33333333-3333-4333-8333-333333333333' },
      ],
    },
    notification: {
      createMany: async (input) => {
        notificationWrites.push(input);
        return { count: input.data.length };
      },
    },
  };
  const client = {
    webUrl: 'http://odoo.test',
    execute: async (model, method) => {
      if (model === 'utm.campaign' && method === 'search_read') return [{ id: 44, name: '[SKYLINE:event] Demo Day' }];
      if (model === 'crm.lead' && method === 'search_read') {
        return [{
          id: 73,
          name: 'Example Sponsor - Gold',
          partner_id: [9, 'Example Sponsor'],
          expected_revenue: 1000,
          probability: 100,
          stage_id: [4, 'Won'],
          active: true,
        }];
      }
      throw new Error(`Unexpected Odoo call: ${model}.${method}`);
    },
  };
  const service = createOdooService({ prisma, client });

  const first = await service.summary(event.id);
  const second = await service.summary(event.id);

  assert.equal(first.won[0].status, 'DONE');
  assert.equal(first.won[0].crmStatus, 'WON');
  assert.equal(first.won[0].paymentStatus, 'COMMITTED');
  assert.equal(notificationWrites[0].skipDuplicates, true);
  assert.equal(notificationWrites[0].data.length, 2);
  assert.deepEqual(
    notificationWrites[0].data.map((row) => row.id),
    notificationWrites[1].data.map((row) => row.id),
  );
  assert.equal(second.won[0].status, 'DONE');
});
