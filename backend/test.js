import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const data = await prisma.volunteer.findMany({ include: { user: { include: { memberships: true } } } });
  console.log(JSON.stringify(data, null, 2));
}

main().finally(() => prisma.$disconnect());
