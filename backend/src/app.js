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
import { stubAuth } from './middleware/stubAuth.js';
import { requirePermission as stubRequirePermission } from './middleware/stubAuthorize.js';
import { createPaymentsService } from './modules/payments/payments.service.js';
import { createPaymentsRouter } from './modules/payments/payments.routes.js';
import { createFinanceService } from './modules/finance/finance.service.js';
import { createFinanceRouter } from './modules/finance/finance.routes.js';
import { createFilesService } from './modules/files/files.service.js';
import { createFilesRouter } from './modules/files/files.routes.js';

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

  // `authenticate` is Person B's middleware; until it lands the dev-only stubAuth stands in.
  const authenticate = stubAuth(config);
  const payments = createPaymentsService({ prisma, config, logger });
  app.use('/api/v1/payments', createPaymentsRouter({ service: payments, authenticate, config }));

  // Commerce files (receipts, merch images, event covers, ledger attachments).
  const files = createFilesService({ prisma, config });
  app.use('/api/v1/commerce/files', createFilesRouter({ service: files, authenticate }));

  // Finance: ledger + budgets. `requirePermission` is B's `authorize` (dev stub for now).
  const finance = createFinanceService({ prisma, files });
  app.use('/api/v1', createFinanceRouter({ service: finance, authenticate, requirePermission: stubRequirePermission }));

  app.use(notFound);
  app.use(errorHandler({ isProduction: config.isProduction }));

  return app;
}
