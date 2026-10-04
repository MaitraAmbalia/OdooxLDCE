import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.user.findUnique({ 
  where: { email: 'volunteerhead@nirmauni.ac.in' }, 
  include: { memberships: true, roleAssignments: true, volunteer: true } 
})
.then(u => console.log(JSON.stringify(u, null, 2)))
.finally(() => prisma.$disconnect());
