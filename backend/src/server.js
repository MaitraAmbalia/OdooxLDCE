import { createApp } from './app.js';
import { getConfig } from './config/env.js';
import { disconnectPrisma, getPrismaClient } from './db/prisma.js';
import { createLogger } from './lib/logger.js';
import { startJobs } from './platform/jobs/runner.js';
import { disconnectClients } from './platform/db/clients.js';
import commerce from './contexts/commerce/index.js';

const config = getConfig();
const logger = createLogger(config);
const prisma = getPrismaClient();
const app = createApp({ config, logger, prisma });
const jobs = await startJobs({ config, logger, contexts: [app.locals.people, commerce] });

const server = app.listen(config.port, () => {
  logger.info({ port: config.port, environment: config.nodeEnv }, 'API server started');
});

let shuttingDown = false;

async function shutdown(signal, exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, 'Shutting down API server');

  const forceExit = setTimeout(() => {
    logger.error('Graceful shutdown timed out');
    process.exit(1);
  }, 10_000);
  forceExit.unref();

  server.close(async (error) => {
    try {
      await disconnectPrisma();
      await jobs.stop();
      await disconnectClients();
    } catch (disconnectError) {
      logger.error({ err: disconnectError }, 'Failed to disconnect Prisma');
      exitCode = 1;
    }

    if (error) {
      logger.error({ err: error }, 'HTTP server shutdown failed');
      exitCode = 1;
    }

    clearTimeout(forceExit);
    process.exit(exitCode);
  });
}

process.once('SIGTERM', () => void shutdown('SIGTERM'));
process.once('SIGINT', () => void shutdown('SIGINT'));
process.once('uncaughtException', (error) => {
  logger.fatal({ err: error }, 'Uncaught exception');
  void shutdown('uncaughtException', 1);
});
process.once('unhandledRejection', (error) => {
  logger.fatal({ err: error }, 'Unhandled rejection');
  void shutdown('unhandledRejection', 1);
});
