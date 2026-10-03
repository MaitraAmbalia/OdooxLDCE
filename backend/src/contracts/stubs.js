/**
 * DEV STAND-INS for pieces owned by other modules. Delete/replace when the real ones land.
 */

// Ledger category per payment purpose (arch §5.3).
export const LEDGER_CATEGORY_BY_PURPOSE = {
  MEMBERSHIP: 'DUES',
  TICKET: 'TICKETS',
  MERCH_ORDER: 'MERCH',
};

/**
 * Stub for finance.postIncome (real one = finance module, Module 2).
 * skipDuplicates => INSERT ... ON CONFLICT DO NOTHING on (source_type, source_id), so a replayed
 * webhook can never create a second ledger row (and never aborts the surrounding transaction).
 */
export async function postIncome(entry, tx) {
  await tx.ledgerEntry.createMany({
    data: [
      {
        direction: 'IN',
        category: entry.category,
        amountPaise: BigInt(entry.amountPaise),
        sourceType: entry.sourceType,
        sourceId: entry.sourceId,
        eventId: entry.eventId ?? null,
        projectId: entry.projectId ?? null,
        description: entry.description,
        occurredAt: new Date(),
      },
    ],
    skipDuplicates: true,
  });
}
