import { getConfig } from '../src/config/env.js';
import { getClient, disconnectClients, transaction } from '../src/platform/db/clients.js';
import { publish } from '../src/platform/events/bus.js';

const config = getConfig();
if (config.isProduction) throw new Error('Fixture event publishing is disabled in production');
try {
  const [type, json] = process.argv.slice(2);
  if (!type || !json) throw new Error('Usage: npm run emit -- <event-type> <JSON-payload>');
  const id = await transaction(await getClient('platform', config), (tx) => publish(tx, type, JSON.parse(json)));
  console.log(`Published fixture event ${id}`);
} finally { await disconnectClients(); }
