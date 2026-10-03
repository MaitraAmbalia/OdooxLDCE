import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { getConfig } from './config/env.js';
import { getPrismaClient } from './db/prisma.js';
import { createLogger, createRequestLogger } from './lib/logger.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authenticate, authorize } from './middleware/authenticate.js';

import { createHealthRouter } from './health/health.routes.js';
import { createAuthService } from './modules/auth/auth.service.js';
import { createAuthRouter } from './modules/auth/auth.routes.js';
import { createUsersService } from './modules/users/users.service.js';
import { createUsersRouter } from './modules/users/users.routes.js';
import { createAccessService } from './modules/access/access.service.js';
import { createAccessRouter } from './modules/access/access.routes.js';
import { createVolunteersService } from './modules/volunteers/volunteers.service.js';
import { createVolunteersRouter } from './modules/volunteers/volunteers.routes.js';
import { createProjectsService } from './modules/projects/projects.service.js';
import { createProjectsRouter } from './modules/projects/projects.routes.js';
import { createNotificationsService } from './modules/notifications/notifications.service.js';
import { createNotificationsRouter } from './modules/notifications/notifications.routes.js';
import { canWorkDoor, createEventsService } from './modules/events/events.service.js';
import { createEventsRouter } from './modules/events/events.routes.js';
import { createTicketsService } from './modules/tickets/tickets.service.js';
import { createTicketsRouter } from './modules/tickets/tickets.routes.js';
import { createMerchService } from './modules/merch/merch.service.js';
import { createMerchRouter } from './modules/merch/merch.routes.js';
import { createPaymentsService } from './modules/payments/payments.service.js';
import { createPaymentsRouter } from './modules/payments/payments.routes.js';
import { createFinanceService } from './modules/finance/finance.service.js';
import { createFinanceRouter } from './modules/finance/finance.routes.js';
import { createMembershipsService } from './modules/memberships/memberships.service.js';
import { createMembershipsRouter } from './modules/memberships/memberships.routes.js';
import { createFilesService } from './modules/files/files.service.js';
import { createFilesRouter } from './modules/files/files.routes.js';
import { createGovernanceRouter } from './modules/governance/governance.routes.js';
import { createApprovalsService } from './modules/approvals/approvals.service.js';
import { createApprovalsRouter } from './modules/approvals/approvals.routes.js';
import { createDashboardsService } from './modules/dashboards/dashboards.service.js';
import { createDashboardsRouter } from './modules/dashboards/dashboards.routes.js';
import { createNewsletterService } from './modules/newsletter/newsletter.service.js';
import { createNewsletterRouter } from './modules/newsletter/newsletter.routes.js';

export function createApp({
  config = getConfig(),
  prisma = getPrismaClient(),
  logger = createLogger(config),
} = {}) {
  const auth = authenticate({ config });
  const app = express();

  // Core Middleware
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin || true, credentials: true }));
  app.use(cookieParser());
  app.use('/api/v1/payments/webhook', express.raw({ type: 'application/json', limit: '1mb' }));
  app.use(express.json({ limit: config.jsonBodyLimit }));
  app.use(createRequestLogger(logger));

  // Base Health Check
  app.use('/api/v1', createHealthRouter({ prisma }));

  // Feature Routers
  app.use('/api/v1', createAuthRouter({ service: createAuthService({ prisma, config }), authenticate: auth }));
  app.use('/api/v1', createUsersRouter({ service: createUsersService({ prisma }), authenticate: auth, authorize }));
  app.use('/api/v1', createAccessRouter({ service: createAccessService({ prisma }), authenticate: auth, authorize }));
  app.use('/api/v1', createVolunteersRouter({ service: createVolunteersService({ prisma }), authenticate: auth }));
  app.use('/api/v1', createProjectsRouter({ service: createProjectsService({ prisma }), authenticate: auth }));
  app.use('/api/v1', createNotificationsRouter({ service: createNotificationsService({ prisma }), authenticate: auth, prisma }));
  app.use('/api/v1', createEventsRouter({ service: createEventsService({ prisma }), authenticate: auth, authorize }));

  const paymentsService = createPaymentsService({ prisma, config, logger });
  app.use('/api/v1', createTicketsRouter({ service: createTicketsService({ prisma, config, createPayment: paymentsService.createPayment }), authenticate: auth, authorize }));
  const filesService = createFilesService({ prisma, config });

  app.use('/api/v1', createMerchRouter({ service: createMerchService({ prisma, createPayment: paymentsService.createPayment }), authenticate: auth }));
  app.use('/api/v1/payments', createPaymentsRouter({ service: paymentsService, authenticate: auth, config }));
  app.use('/api/v1/files', createFilesRouter({ service: filesService, authenticate: auth }));
  app.use(
    '/api/v1',
    createMembershipsRouter({
      service: createMembershipsService({ prisma, config }),
      createPayment: paymentsService.createPayment,
      authenticate: auth,
      requirePermission: authorize,
      canWorkDoor: (user, eventId) => canWorkDoor(prisma, user, eventId),
    })
  );
  app.use('/api/v1', createFinanceRouter({ service: createFinanceService({ prisma, files: filesService }), authenticate: auth, requirePermission: authorize }));
  app.use('/api/v1', createApprovalsRouter({ service: createApprovalsService({ prisma }), authenticate: auth, requirePermission: authorize }));
  app.use('/api/v1', createDashboardsRouter({ service: createDashboardsService({ prisma }), authenticate: auth }));
  app.use('/api/v1', createGovernanceRouter({ prisma, authenticate: auth }));
  app.use(
    '/api/v1',
    createNewsletterRouter({
      service: createNewsletterService({ prisma, config }),
      authenticate: auth,
      authorize,
    })
  );

  app.get('/', (req, res) => res.json({ message: 'Skyline API Server Running' }));

  // Error Handling
  app.use(notFound);
  app.use(errorHandler({ isProduction: config.isProduction }));

  return app;
}
