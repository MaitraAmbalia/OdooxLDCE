import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { getConfig } from './config/env.js';
import { getPrismaClient } from './db/prisma.js';
import { createLogger, createRequestLogger } from './lib/logger.js';
import { AppError } from './lib/AppError.js';
import { requestId } from './middleware/requestId.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import { createHealthRouter } from './health/health.routes.js';
import { createPaymentsService } from './modules/payments/payments.service.js';
import { createPaymentsRouter } from './modules/payments/payments.routes.js';
import { createFinanceService } from './modules/finance/finance.service.js';
import { createFinanceRouter } from './modules/finance/finance.routes.js';
import { createMembershipsService } from './modules/memberships/memberships.service.js';
import { createMembershipsRouter } from './modules/memberships/memberships.routes.js';
import { createFilesService } from './modules/files/files.service.js';
import { createFilesRouter } from './modules/files/files.routes.js';
import { authenticate, authorize } from './platform/auth/middleware.js';
import { createPeopleContext } from './contexts/people/index.js';
import { router as commerceRouter } from './contexts/commerce/index.js';
import { createPlatformRouter } from './platform/routes.js';

function createCorsOptions(config) {
  return {
    credentials: true,
    origin(origin, callback) {
      if (!origin || origin === config.corsOrigin) return callback(null, true);
      return callback(new AppError('CORS_ORIGIN_DENIED', 403, 'Origin is not allowed'));
    },
  };
}

export function createApp(options = {}) {
  const config = options.config ?? getConfig();
  const prisma = options.prisma ?? getPrismaClient();
  const logger = options.logger ?? createLogger(config);
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] },
      },
    }),
  );
  app.use(cors(createCorsOptions(config)));
  app.use(cookieParser());

  // The payment webhook must retain its exact bytes for signature verification.
  app.use('/api/v1/payments/webhook', express.raw({ type: 'application/json', limit: '1mb' }));
  app.use(express.json({ limit: config.jsonBodyLimit }));

  app.use(requestId);
  app.use(createRequestLogger(logger));

  app.use('/api/v1', createHealthRouter({ prisma }));
  const people = options.peopleContext ?? createPeopleContext({ config, client: options.peopleClient, storage: options.storage, transport: options.transport });
  app.locals.people = people;
  app.use('/api/v1', createPlatformRouter({ config, client: options.platformClient }));
  app.use('/api/v1', commerceRouter);
  app.use('/api/v1', people.router);

  // Payment and finance services use req.user.id; the kernel also exposes the JWT sub.
  const auth = options.authenticate ?? authenticate({ config });
  const payments = options.paymentsService ?? createPaymentsService({ prisma, config, logger });
  app.use('/api/v1/payments', createPaymentsRouter({ service: payments, authenticate: auth, config }));

  // Commerce files (receipts, merch images, event covers, ledger attachments).
  const files = createFilesService({ prisma, config });
  app.use('/api/v1/commerce/files', createFilesRouter({ service: files, authenticate: auth }));

  const finance = createFinanceService({ prisma, files });
  app.use('/api/v1', createFinanceRouter({ service: finance, authenticate: auth, requirePermission: authorize }));

  // Memberships: tiers, checkout (via payments), card QR, verify, list, stats.
  const memberships = createMembershipsService({ prisma, config });
  app.use(
    '/api/v1',
    createMembershipsRouter({ service: memberships, createPayment: payments.createPayment, authenticate: auth, requirePermission: authorize }),
  );

  app.use(notFound);
  app.use(errorHandler({ isProduction: config.isProduction }));

  return app;
}
