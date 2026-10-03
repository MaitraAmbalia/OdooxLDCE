import { createApp } from './app.js';
import { getConfig } from './config/env.js';
import { getPrismaClient } from './db/prisma.js';
import { createLogger } from './lib/logger.js';
import { startMailWorker } from './jobs/mail.worker.js';

const config = getConfig();
const logger = createLogger(config);
const prisma = getPrismaClient();
const app = createApp({ config, logger, prisma });

app.listen(config.port, () => {
  logger.info({ port: config.port, environment: config.nodeEnv }, 'API server started');
  startMailWorker({ prisma, logger });
});

