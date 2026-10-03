import { PrismaClient } from '@prisma/client';

let prisma;

export function getPrismaClient() {
  prisma ??= new PrismaClient();
  return prisma;
}

export async function disconnectPrisma() {
  if (!prisma) return;

  await prisma.$disconnect();
  prisma = undefined;
}
