import crypto from 'node:crypto';
import { AppError } from '../../lib/AppError.js';
import { auditLog } from '../../utils/audit.js';

const ELIGIBLE_EVENT_STATUSES = ['APPROVED', 'PUBLISHED'];
const MARKER_PATTERN = /\[ODOO_LEAD:(\d+)\]/;

function campaignName(event) {
  return `[SKYLINE:${event.id}] ${event.title}`;
}

function deterministicUuid(value) {
  const bytes = Buffer.from(crypto.createHash('sha256').update(value).digest().subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function partnerName(value) {
  if (Array.isArray(value)) return value[1] || null;
  return null;
}

function stageName(value) {
  if (Array.isArray(value)) return value[1] || '';
  return '';
}

function isWon(lead) {
  return Number(lead.probability) >= 100 || stageName(lead.stage_id).trim().toLowerCase() === 'won';
}

function publicLedgerEntry(entry) {
  return {
    id: entry.id,
    amountPaise: Number(entry.amountPaise),
    occurredAt: entry.occurredAt,
    description: entry.description,
  };
}

export function createOdooService({ prisma, client }) {
  async function requireEvent(eventId) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        venue: true,
        startAt: true,
        status: true,
        sponsorshipRequired: true,
        sponsorshipTargetPaise: true,
        sponsorshipDeadline: true,
        sponsorshipPitch: true,
        sponsorshipPackages: true,
        sponsorBenefits: true,
      },
    });
    if (!event) throw new AppError('NOT_FOUND', 404, 'Event was not found');
    if (!event.sponsorshipRequired || !ELIGIBLE_EVENT_STATUSES.includes(event.status)) {
      throw new AppError('INVALID_STATE_TRANSITION', 409, 'This event is not ready for sponsorship outreach');
    }
    return event;
  }

  async function findCampaign(event, { create = false } = {}) {
    const name = campaignName(event);
    const rows = await client.execute('utm.campaign', 'search_read', [[['name', '=', name]]], {
      fields: ['id', 'name'],
      limit: 1,
    });
    if (rows[0]) return rows[0];
    if (!create) return null;
    const id = await client.execute('utm.campaign', 'create', [{ name }]);
    return { id, name };
  }

  async function ensureTag(name) {
    const rows = await client.execute('crm.tag', 'search_read', [[['name', '=', name]]], {
      fields: ['id', 'name'],
      limit: 1,
    });
    if (rows[0]) return rows[0].id;
    return client.execute('crm.tag', 'create', [{ name }]);
  }

  async function findOrCreatePartner(input) {
    const domain = ['|', ['email', '=ilike', input.email], ['name', '=ilike', input.companyName]];
    const rows = await client.execute('res.partner', 'search_read', [domain], {
      fields: ['id', 'name', 'email'],
      limit: 1,
    });
    if (rows[0]) return rows[0].id;
    return client.execute('res.partner', 'create', [{
      name: input.companyName,
      is_company: true,
      email: input.email,
      phone: input.phone || false,
      comment: `Primary sponsorship contact: ${input.contactName}`,
    }]);
  }

  async function leadsForEvent(event) {
    const campaign = await findCampaign(event);
    if (!campaign) return { campaign: null, leads: [] };
    const leads = await client.execute('crm.lead', 'search_read', [[['campaign_id', '=', campaign.id]]], {
      fields: ['id', 'name', 'partner_id', 'contact_name', 'email_from', 'expected_revenue', 'probability', 'stage_id', 'active', 'activity_state', 'activity_date_deadline'],
      context: { active_test: false },
      order: 'id desc',
    });
    return { campaign, leads };
  }

  async function health() {
    const uid = await client.authenticate();
    await client.execute('crm.lead', 'search_count', [[]]);
    return { enabled: true, connected: true, uid, webUrl: client.webUrl };
  }

  async function listReadyEvents() {
    const rows = await prisma.event.findMany({
      where: { sponsorshipRequired: true, status: { in: ELIGIBLE_EVENT_STATUSES } },
      orderBy: [{ sponsorshipDeadline: 'asc' }, { startAt: 'asc' }],
      select: {
        id: true,
        title: true,
        venue: true,
        startAt: true,
        status: true,
        sponsorshipTargetPaise: true,
        sponsorshipDeadline: true,
        sponsorshipPitch: true,
        sponsorshipPackages: true,
        sponsorBenefits: true,
      },
    });
    return rows.map((event) => ({
      ...event,
      sponsorshipTargetPaise: Number(event.sponsorshipTargetPaise),
    }));
  }

  async function createOpportunity(eventId, input) {
    const event = await requireEvent(eventId);
    const [campaign, partnerId, skylineTag, sponsorshipTag, packageTag] = await Promise.all([
      findCampaign(event, { create: true }),
      findOrCreatePartner(input),
      ensureTag('Skyline'),
      ensureTag('Sponsorship'),
      ensureTag(input.packageName),
    ]);
    const amountRupees = input.expectedAmountPaise / 100;
    const description = [
      `Skyline event: ${event.title}`,
      `Skyline event ID: ${event.id}`,
      `Event date: ${event.startAt.toISOString()}`,
      `Venue: ${event.venue}`,
      `Package: ${input.packageName}`,
      `Pitch: ${event.sponsorshipPitch}`,
      `Sponsor benefits: ${event.sponsorBenefits}`,
      input.note ? `Initial note: ${input.note}` : null,
    ].filter(Boolean).join('\n');

    const leadId = await client.execute('crm.lead', 'create', [{
      type: 'opportunity',
      name: `${input.companyName} - ${input.packageName} - ${event.title}`,
      partner_id: partnerId,
      partner_name: input.companyName,
      contact_name: input.contactName,
      email_from: input.email,
      phone: input.phone || false,
      expected_revenue: amountRupees,
      campaign_id: campaign.id,
      tag_ids: [[6, 0, [skylineTag, sponsorshipTag, packageTag]]],
      description,
    }]);

    return {
      odooLeadId: leadId,
      odooUrl: `${client.webUrl}/web#id=${leadId}&model=crm.lead&view_type=form`,
      campaign: campaign.name,
    };
  }

  async function summary(eventId) {
    const event = await requireEvent(eventId);
    const { campaign, leads } = await leadsForEvent(event);
    const ledgerRows = await prisma.ledgerEntry.findMany({
      where: { eventId, direction: 'IN', category: 'SPONSORSHIP', sourceType: 'MANUAL' },
      select: { id: true, amountPaise: true, occurredAt: true, description: true },
    });

    const receivedByLead = new Map();
    for (const entry of ledgerRows) {
      const leadId = Number(entry.description.match(MARKER_PATTERN)?.[1]);
      if (Number.isInteger(leadId)) {
        receivedByLead.set(leadId, (receivedByLead.get(leadId) || 0) + Number(entry.amountPaise));
      }
    }

    let openPipelinePaise = 0;
    let wonCommitmentsPaise = 0;
    let overdueActivities = 0;
    const won = [];
    for (const lead of leads) {
      const expectedPaise = Math.round(Number(lead.expected_revenue || 0) * 100);
      if (lead.activity_state === 'overdue') overdueActivities += 1;
      if (isWon(lead)) {
        const receivedPaise = receivedByLead.get(lead.id) || 0;
        wonCommitmentsPaise += expectedPaise;
        won.push({
          id: lead.id,
          name: lead.name,
          sponsor: partnerName(lead.partner_id) || lead.contact_name || lead.email_from || 'Sponsor',
          expectedAmountPaise: expectedPaise,
          receivedAmountPaise: receivedPaise,
          remainingAmountPaise: Math.max(0, expectedPaise - receivedPaise),
          paymentStatus: receivedPaise <= 0 ? 'COMMITTED' : receivedPaise < expectedPaise ? 'PARTIALLY_RECEIVED' : 'RECEIVED',
          odooUrl: `${client.webUrl}/web#id=${lead.id}&model=crm.lead&view_type=form`,
        });
      } else if (lead.active !== false) {
        openPipelinePaise += expectedPaise;
      }
    }

    return {
      eventId,
      campaign: campaign?.name ?? campaignName(event),
      targetPaise: Number(event.sponsorshipTargetPaise),
      openPipelinePaise,
      wonCommitmentsPaise,
      receivedPaise: ledgerRows.reduce((sum, row) => sum + Number(row.amountPaise), 0),
      openOpportunities: leads.filter((lead) => lead.active !== false && !isWon(lead)).length,
      overdueActivities,
      won,
    };
  }

  async function recordReceipt(eventId, odooLeadId, input, actor, req) {
    const event = await requireEvent(eventId);
    const campaign = await findCampaign(event);
    if (!campaign) throw new AppError('ODOO_RECORD_NOT_FOUND', 404, 'The Odoo event campaign was not found');
    const leads = await client.execute('crm.lead', 'read', [[odooLeadId]], {
      fields: ['id', 'name', 'partner_id', 'expected_revenue', 'probability', 'stage_id', 'campaign_id'],
      context: { active_test: false },
    });
    const lead = leads[0];
    if (!lead) throw new AppError('ODOO_RECORD_NOT_FOUND', 404, 'The Odoo opportunity was not found');
    const leadCampaignId = Array.isArray(lead.campaign_id) ? lead.campaign_id[0] : lead.campaign_id;
    if (leadCampaignId !== campaign.id) throw new AppError('ODOO_EVENT_MISMATCH', 409, 'The Odoo opportunity belongs to another event');
    if (!isWon(lead)) throw new AppError('ODOO_OPPORTUNITY_NOT_WON', 409, 'Only a Won opportunity can be recorded as received');

    const existingEntries = await prisma.ledgerEntry.findMany({
      where: { eventId, direction: 'IN', category: 'SPONSORSHIP', sourceType: 'MANUAL' },
      select: { amountPaise: true, description: true },
    });
    const alreadyReceived = existingEntries
      .filter((row) => Number(row.description.match(MARKER_PATTERN)?.[1]) === odooLeadId)
      .reduce((sum, row) => sum + Number(row.amountPaise), 0);
    const expectedPaise = Math.round(Number(lead.expected_revenue || 0) * 100);
    if (alreadyReceived + input.amountReceivedPaise > expectedPaise) {
      throw new AppError('SPONSORSHIP_OVERPAYMENT', 409, 'The received amount exceeds the Won sponsorship value');
    }

    const normalizedReference = input.paymentReference.trim().toUpperCase();
    const sourceId = deterministicUuid(`odoo:${eventId}:${odooLeadId}:${normalizedReference}`);
    return prisma.$transaction(async (tx) => {
      const { count } = await tx.ledgerEntry.createMany({
        data: [{
          direction: 'IN',
          category: 'SPONSORSHIP',
          amountPaise: BigInt(input.amountReceivedPaise),
          sourceType: 'MANUAL',
          sourceId,
          eventId,
          description: `[ODOO_LEAD:${odooLeadId}] ${lead.name}; payment ${normalizedReference}${input.note ? `; ${input.note}` : ''}`,
          occurredAt: input.receivedAt,
          recordedById: actor.sub,
        }],
        skipDuplicates: true,
      });
      const entry = await tx.ledgerEntry.findFirst({ where: { sourceType: 'MANUAL', sourceId } });
      if (count === 1) {
        await auditLog({
          actorId: actor.sub,
          action: 'SPONSORSHIP.RECEIPT_RECORDED',
          entityType: 'event',
          entityId: eventId,
          after: { odooLeadId, paymentReference: normalizedReference, ledgerEntryId: entry.id, amountPaise: input.amountReceivedPaise },
          req,
        }, tx);
      }
      return { ...publicLedgerEntry(entry), duplicate: count === 0 };
    });
  }

  return { health, listReadyEvents, createOpportunity, summary, recordReceipt };
}
