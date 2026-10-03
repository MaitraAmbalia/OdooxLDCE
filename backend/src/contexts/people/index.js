import { Router } from 'express';
import { getClient, lock } from '../../platform/db/clients.js';
import { createStorage } from '../../platform/storage/index.js';
import { subscribe } from '../../platform/events/bus.js';
import { revokeSessions } from './auth/repository.js';
import { createAuthService } from './auth/service.js';
import { createAuthRouter } from './auth/routes.js';
import { createUsersService } from './users/service.js';
import { createAccessService } from './access/service.js';
import { createFilesService } from './files/service.js';
import { createNewsletterService } from './newsletter/service.js';
import { createEmailSender } from './email/service.js';
import { createPeopleRoutes } from './routes.js';

const revoke = async (tx, event) => { await lock(tx, `user:${event.payload.userId}`); await revokeSessions(tx, event.payload.userId); };
export const subscribers = [
  subscribe('commerce.membership.lapsed', 'people.auth.membership-lapsed', revoke),
  subscribe('people.role.ended', 'people.auth.role-ended', revoke),
];

export function createPeopleContext({ config, client = () => getClient('people', config), storage = createStorage(config), transport } = {}) {
  const services = { auth: createAuthService({ client, config }), users: createUsersService({ client }),
    access: createAccessService({ client }), files: createFilesService({ client, storage }),
    newsletter: createNewsletterService({ client, config }) };
  const contextRouter = Router();
  contextRouter.use(createAuthRouter({ service: services.auth, config }));
  contextRouter.use(createPeopleRoutes({ ...services, config }));
  const contextJobs = [{ name: 'people.email.outbox', intervalSeconds: 30,
    handler: createEmailSender({ client, config, transport }) }, {
    name: 'people.roles.termRollover', schedule: '1 0 * * *', handler: async () => {
      const db = await client();
      const now = new Date();
      await db.refreshToken.updateMany({ where: { revokedAt: null,
        user: { assignments: { some: { termEnd: { lte: now, gt: new Date(now.getTime() - 24 * 3600000) } } } } },
        data: { revokedAt: now, revokeReason: 'ADMIN_REVOKED' } });
    },
  }, { name: 'people.cleanup', schedule: '0 3 * * *', handler: async () => {
    const db = await client();
    await db.emailToken.deleteMany({ where: { expiresAt: { lt: new Date(Date.now() - 24 * 3600000) } } });
    const unused = await db.peopleFile.findMany({ where: { attachedAt: null, createdAt: { lt: new Date(Date.now() - 24 * 3600000) } }, take: 100 });
    for (const file of unused) {
      try { await services.files.remove(file.id, file.ownerId, 'scheduled-cleanup'); }
      catch (error) { if (error.code !== 'FILE_ATTACHED' && error.code !== 'NOT_FOUND') throw error; }
    }
  } }];
  return { router: contextRouter, subscribers, jobs: contextJobs, services };
}
