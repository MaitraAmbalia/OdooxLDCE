import { getConfig } from '../src/config/env.js';
import { getClient, disconnectClients, transaction } from '../src/platform/db/clients.js';

const config = getConfig();
if (config.isProduction) throw new Error('Member fixtures are disabled in production');
try {
  const db = await getClient('platform', config);
  const enable = process.argv.includes('--enable');
  if (!enable && !process.argv.includes('--disable')) throw new Error('Use --enable or --disable');
  await transaction(db, async (tx) => {
    if (enable) {
      // Explicit, dev-only replacement of the frozen empty Commerce contracts.
      await tx.$executeRaw`CREATE TABLE IF NOT EXISTS platform.dev_member_fixtures
        (user_id uuid PRIMARY KEY, status text NOT NULL CHECK (status IN ('ACTIVE','LAPSED','PENDING','NONE')),
         active_since timestamptz, expires_at timestamptz)`;
      await tx.$executeRaw`CREATE OR REPLACE VIEW commerce.v_member_status AS SELECT user_id, status, active_since, expires_at FROM platform.dev_member_fixtures`;
      await tx.$executeRaw`CREATE OR REPLACE VIEW commerce.v_active_members AS SELECT user_id FROM platform.dev_member_fixtures WHERE status = 'ACTIVE' AND (expires_at IS NULL OR expires_at > now())`;
    } else {
      await tx.$executeRaw`CREATE OR REPLACE VIEW commerce.v_member_status AS SELECT NULL::uuid AS user_id, NULL::text AS status, NULL::timestamptz AS active_since, NULL::timestamptz AS expires_at WHERE false`;
      await tx.$executeRaw`CREATE OR REPLACE VIEW commerce.v_active_members AS SELECT NULL::uuid AS user_id WHERE false`;
    }
  });
  console.log(enable ? 'Development member fixture views enabled. Seed People personas next.' : 'Empty Commerce member views restored.');
} finally { await disconnectClients(); }
