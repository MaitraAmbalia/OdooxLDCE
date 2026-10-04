import http from 'node:http';
import { createApp } from './app.js';
import { getConfig } from './config/env.js';
import { getPrismaClient } from './db/prisma.js';
import { createLogger } from './lib/logger.js';
import { startMailWorker } from './jobs/mail.worker.js';
import { initSocket } from './lib/socket.js';

const config = getConfig();
const logger = createLogger(config);
const prisma = getPrismaClient();
const app = createApp({ config, logger, prisma });
const server = http.createServer(app);

initSocket(server, config, logger);

server.on('error', (err) => {
  logger.error({ err }, 'HTTP server error');
  if (err.code === 'EADDRINUSE') {
    logger.error(`Port ${config.port} is already in use.`);
  }
});

server.listen(config.port, () => {
  logger.info({ port: config.port, environment: config.nodeEnv }, 'API server started with WebSocket support');
  startMailWorker({ prisma, logger });
});


