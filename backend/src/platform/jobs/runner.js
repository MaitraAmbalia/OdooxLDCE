import { PgBoss } from 'pg-boss';
import { getClient } from '../db/clients.js';
import { dispatchOutbox, handleOnce } from '../events/bus.js';

export async function startJobs({ config, logger, contexts }) {
  const url = new URL(config.platformDatabaseUrl);
  url.searchParams.delete('schema');
  const boss = new PgBoss({ connectionString: url.toString(), schema: 'platform_jobs', retryLimit: 5, retryBackoff: true });
  boss.on('error', (error) => logger.error({ err: error }, 'Job runner error'));
  await boss.start();
  const timers = [];
  const subscribers = contexts.flatMap((context) => context.subscribers);
  for (const subscriber of subscribers) {
    await boss.createQueue(subscriber.queue, { retryLimit: 5, retryBackoff: true });
    await boss.work(subscriber.queue, { pollingIntervalSeconds: 1 }, async (jobs) => {
      for (const job of jobs) await handleOnce(await getClient(subscriber.context, config), subscriber, job.data);
    });
  }
  const jobs = contexts.flatMap((context) => context.jobs);
  jobs.push({ name: 'platform.events.dispatch', intervalSeconds: 2,
    handler: async () => dispatchOutbox(await getClient('platform', config), boss, subscribers) });
  jobs.push({ name: 'platform.cleanup', schedule: '0 3 * * *', handler: async () => {
    const platform = await getClient('platform', config);
    await platform.idempotencyKey.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  } });
  for (const job of jobs) {
    await boss.createQueue(job.name, { retryLimit: 5, retryBackoff: true });
    await boss.work(job.name, { pollingIntervalSeconds: 1 }, async () => job.handler());
    if (job.schedule) await boss.schedule(job.name, job.schedule, {}, { tz: config.timezone });
    if (job.intervalSeconds) {
      const enqueue = () => boss.send(job.name, {}, { singletonKey: job.name }).catch((error) => logger.error({ err: error }, 'Job enqueue failed'));
      timers.push(setInterval(enqueue, job.intervalSeconds * 1000));
      await enqueue();
    }
  }
  return { boss, async stop() { timers.forEach(clearInterval); await boss.stop({ graceful: true, timeout: 10000 }); } };
}
