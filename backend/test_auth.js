import { createAuthService } from './src/modules/auth/auth.service.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const auth = createAuthService({ prisma, config: { accessSecret: 'sec', refreshSecret: 'sec' } });

auth.login({ email: 'volunteer2@nirmauni.ac.in', password: 'Password123!' }, {})
  .then(res => {
    console.log("Permissions:", res.data.permissions);
  })
  .catch(console.error)
  .finally(() => prisma.$disconnect());
