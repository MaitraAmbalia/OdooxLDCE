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
import { createEventsService } from './modules/events/events.service.js';
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

function createCorsOptions(config) {
  return {
    credentials: true,
    origin(origin, callback) {
      if (!config.isProduction) return callback(null, true);
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
    })
  );
  app.use(cors(createCorsOptions(config)));
  app.use(cookieParser());

  // Webhook raw byte body parser
  app.use('/api/v1/payments/webhook', express.raw({ type: 'application/json', limit: '1mb' }));
  app.use(express.json({ limit: config.jsonBodyLimit }));

  app.use(requestId);
  app.use(createRequestLogger(logger));

  // Health route
  app.use('/api/v1', createHealthRouter({ prisma }));

  // Feature Routers
  app.use('/api/v1', createAuthRouter({ service: createAuthService({ prisma, config }), authenticate: auth }));
  app.use('/api/v1', createUsersRouter({ service: createUsersService({ prisma }), authenticate: auth, authorize }));
  app.use('/api/v1', createAccessRouter({ service: createAccessService({ prisma }), authenticate: auth, authorize }));
  app.use('/api/v1', createVolunteersRouter({ service: createVolunteersService({ prisma }), authenticate: auth }));
  app.use('/api/v1', createProjectsRouter({ service: createProjectsService({ prisma }), authenticate: auth }));
  app.use('/api/v1', createNotificationsRouter({ service: createNotificationsService({ prisma }), authenticate: auth, prisma }));
  app.use('/api/v1', createEventsRouter({ service: createEventsService({ prisma }), authenticate: auth, authorize }));
  app.use('/api/v1', createTicketsRouter({ service: createTicketsService({ prisma }), authenticate: auth, authorize }));
  app.use('/api/v1', createMerchRouter({ service: createMerchService({ prisma }), authenticate: auth }));

  const paymentsService = createPaymentsService({ prisma, config, logger });
  const filesService = createFilesService({ prisma, config });

  const projectsService = createProjectsService({ prisma });
  app.use('/api/v1', createProjectsRouter({ service: projectsService, authenticate: auth }));

  // 3. Notifications (Scene 3)
  const notificationsService = createNotificationsService({ prisma });
  app.use('/api/v1', createNotificationsRouter({ service: notificationsService, authenticate: auth, prisma }));

  // 4. Events & Tickets (Scene 2)
  const eventsService = createEventsService({ prisma });
  app.use('/api/v1', createEventsRouter({ service: eventsService, authenticate: auth, authorize }));

  const ticketsService = createTicketsService({ prisma });
  app.use('/api/v1', createTicketsRouter({ service: ticketsService, authenticate: auth, authorize }));

  // 6. Payments & Memberships (Scene 1)
  const paymentsService = options.paymentsService ?? createPaymentsService({ prisma, config, logger });
  app.use('/api/v1/payments', createPaymentsRouter({ service: paymentsService, authenticate: auth, config }));

  // 5. Merchandise Store (Scene 4)
  const merchService = createMerchService({ prisma, createPayment: paymentsService.createPayment });
  app.use('/api/v1', createMerchRouter({ service: merchService, authenticate: auth }));

  const filesService = createFilesService({ prisma, config });
  app.use('/api/v1/files', createFilesRouter({ service: filesService, authenticate: auth }));

  const membershipsService = createMembershipsService({ prisma, config });
  app.use(
    '/api/v1',
    createMembershipsRouter({
      service: membershipsService,
      createPayment: paymentsService.createPayment,
      authenticate: auth,
      requirePermission: authorize,
    })
  );

  // 7. Finance & Treasurer Ledgers (Scene 6)
  const financeService = createFinanceService({ prisma, files: filesService });
  app.use('/api/v1', createFinanceRouter({ service: financeService, authenticate: auth, requirePermission: authorize }));

  const approvalsService = createApprovalsService({ prisma });
  app.use('/api/v1', createApprovalsRouter({ service: approvalsService, authenticate: auth, requirePermission: authorize }));

  const dashboardsService = createDashboardsService({ prisma });
  app.use('/api/v1', createDashboardsRouter({ service: dashboardsService, authenticate: auth }));

  // 8. Governance, Elections & Meetings
  app.use('/api/v1', createGovernanceRouter({ prisma, authenticate: auth }));

  app.use(notFound);
  app.use(errorHandler({ isProduction: config.isProduction }));

  return app;
}
