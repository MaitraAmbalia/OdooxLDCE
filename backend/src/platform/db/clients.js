import { getConfig } from '../../config/env.js';

const clients = new Map();
const loaders = {
  people: () => import('../../generated/people-client/index.js'),
  platform: () => import('../../generated/platform-client/index.js'),
  commerce: () => import('../../generated/commerce-client/index.js'),
};

export async function getClient(context, config = getConfig()) {
  if (!Object.hasOwn(loaders, context)) throw new Error('Unknown database context');
  if (!clients.has(context)) {
    clients.set(context, loaders[context]().then(({ PrismaClient }) => new PrismaClient({
      datasources: { db: { url: config[`${context}DatabaseUrl`] } },
    })));
  }
  return clients.get(context);
}

export async function disconnectClients() {
  await Promise.all([...clients.values()].map(async (client) => (await client).$disconnect()));
  clients.clear();
}

export async function transaction(client, work) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await client.$transaction(work, { isolationLevel: 'Serializable', timeout: 15000 });
    } catch (error) {
      if (error.code !== 'P2034' || attempt >= 4) throw error;
    }
  }
}

export async function lock(tx, key) {
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))::text`;
}
