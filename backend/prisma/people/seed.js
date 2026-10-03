import { getConfig } from '../../src/config/env.js';
import { getClient, disconnectClients, transaction, lock } from '../../src/platform/db/clients.js';
import { hashPassword } from '../../src/contexts/people/auth/passwords.js';
import { audit } from '../../src/platform/audit/index.js';
import { rolePermissions } from '../../src/contexts/people/access/permissions.js';

const config = getConfig();
if (config.isProduction) throw new Error('Demo seeding is disabled in production');
const password = process.env.PEOPLE_SEED_PASSWORD;
if (!password) throw new Error('Set PEOPLE_SEED_PASSWORD to a strong development-only password');
try {
  const db = await getClient('people', config);
  const passwordHash = await hashPassword(password);
  const personas = [...Object.keys(rolePermissions), 'VOLUNTEER_ONE', 'VOLUNTEER_TWO', 'NON_MEMBER'];
  await transaction(db, async (tx) => {
    await lock(tx, 'people:demo-seed');
    const users = {};
    for (const persona of personas) {
      const email = `${persona.toLowerCase()}@${config.collegeEmailDomain}`;
      users[persona] = await tx.user.upsert({ where: { email }, update: {}, create: { email, name: persona.replaceAll('_', ' '), studentId: `DEMO-${persona}`, emailVerifiedAt: new Date(), passwordHash } });
    }
    for (const role of Object.keys(rolePermissions)) {
      const user = users[role];
      if (!await tx.roleAssignment.findFirst({ where: { userId: user.id, role, termEnd: { gt: new Date() }, endedAt: null } })) {
        const roleAssignment = await tx.roleAssignment.create({ data: { userId: user.id, role, termStart: new Date(), termEnd: new Date(Date.now() + 365 * 24 * 3600000), createdById: users.MENTOR.id, source: 'SYSTEM', reason: 'Development persona seed' } });
        await audit(tx, { action: 'role.seeded', entityType: 'role_assignment', entityId: roleAssignment.id });
      }
    }
    for (const persona of ['VOLUNTEER_ONE', 'VOLUNTEER_TWO']) await tx.volunteer.upsert({ where: { userId: users[persona].id }, update: {}, create: { userId: users[persona].id, skills: ['coordination'] } });
    const fixtures = await tx.$queryRaw`SELECT to_regclass('platform.dev_member_fixtures')::text AS name`;
    if (fixtures[0]?.name) {
      for (const [persona, user] of Object.entries(users)) {
        if (persona === 'NON_MEMBER' || persona === 'MENTOR') continue;
        await tx.$executeRaw`INSERT INTO platform.dev_member_fixtures (user_id, status, active_since, expires_at)
          VALUES (${user.id}::uuid, 'ACTIVE', now() - interval '60 days', now() + interval '365 days')
          ON CONFLICT (user_id) DO NOTHING`;
      }
    }
  });
  console.log('Seeded Mentor, five leadership users, two volunteers and a non-member. Existing passwords were preserved.');
} finally { await disconnectClients(); }
