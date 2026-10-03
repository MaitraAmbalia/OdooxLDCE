import { sendMail } from '../lib/mailer.js';

let intervalId = null;
let isProcessing = false;

/**
 * Process a batch of queued emails from the outbox.
 */
export async function processOutboxBatch({ prisma, logger, batchSize = 20 }) {
  if (isProcessing) return;
  isProcessing = true;

  try {
    const now = new Date();
    const batch = await prisma.emailOutbox.findMany({
      where: {
        status: 'QUEUED',
        sendAfter: { lte: now },
      },
      orderBy: { createdAt: 'asc' },
      take: batchSize,
    });

    if (!batch.length) {
      isProcessing = false;
      return 0;
    }

    if (logger) logger.info({ count: batch.length }, 'Processing email outbox batch');

    let sent = 0;
    for (const item of batch) {
      try {
        await sendMail({
          to: item.to,
          template: item.template,
          payload: item.payload,
        });

        await prisma.emailOutbox.update({
          where: { id: item.id },
          data: {
            status: 'SENT',
            attempts: { increment: 1 },
          },
        });
        sent++;
      } catch (err) {
        const attempts = item.attempts + 1;
        const willFail = attempts >= 5;
        const nextSend = new Date(Date.now() + Math.min(Math.pow(2, attempts) * 10000, 3600000));

        if (logger) {
          logger.error(
            { outboxId: item.id, err: err.message, attempts, willFail },
            'Failed to dispatch email from outbox'
          );
        }

        await prisma.emailOutbox.update({
          where: { id: item.id },
          data: {
            attempts,
            status: willFail ? 'FAILED' : 'QUEUED',
            lastError: err.message || String(err),
            sendAfter: willFail ? item.sendAfter : nextSend,
          },
        });
      }
    }

    return sent;
  } catch (err) {
    if (logger) logger.error({ err: err.message }, 'Error in email worker processing cycle');
    return 0;
  } finally {
    isProcessing = false;
  }
}

/**
 * Start the polling mail worker.
 */
export function startMailWorker({ prisma, logger, intervalMs = 15000 }) {
  if (intervalId) return;

  // Run initial poll shortly after boot
  setTimeout(() => {
    processOutboxBatch({ prisma, logger }).catch(() => {});
  }, 2000);

  intervalId = setInterval(() => {
    processOutboxBatch({ prisma, logger }).catch(() => {});
  }, intervalMs);

  if (logger) logger.info({ intervalMs }, 'Email outbox worker started');
}

/**
 * Stop the mail worker.
 */
export function stopMailWorker() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
