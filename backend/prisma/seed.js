import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/security.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Skyline Student Association database...');

  const defaultPassword = process.env.SEED_PASSWORD || 'Password123!';
  const passwordHash = await hashPassword(defaultPassword);

  // 1. Seed Membership Tiers (Scene 1)
  const annualTier = await prisma.membershipTier.upsert({
    where: { name: 'Annual Membership' },
    update: {},
    create: {
      name: 'Annual Membership',
      pricePaise: BigInt(50000), // ₹500
      durationType: 'ACADEMIC_YEAR',
      benefits: { discountPercent: 20, accessAllEvents: true },
      isActive: true,
    },
  });

  const semesterTier = await prisma.membershipTier.upsert({
    where: { name: 'Semester Membership' },
    update: {},
    create: {
      name: 'Semester Membership',
      pricePaise: BigInt(30000), // ₹300
      durationType: 'SEMESTER',
      benefits: { discountPercent: 10, accessAllEvents: true },
      isActive: true,
    },
  });

  // 2. Seed Users
  const userDefs = [
    { email: 'mentor@nirmauni.ac.in', name: 'Dr. Mentor Sharma', studentId: 'FACULTY-001', role: 'MENTOR' },
    { email: 'president@nirmauni.ac.in', name: 'Aarav Patel', studentId: '22BCE101', role: 'PRESIDENT' },
    { email: 'treasurer@nirmauni.ac.in', name: 'Diya Shah', studentId: '22BCE102', role: 'TREASURER' },
    { email: 'eventhead@nirmauni.ac.in', name: 'Rohan Mehta', studentId: '22BCE103', role: 'EVENT_HEAD' },
    { email: 'volunteer1@nirmauni.ac.in', name: 'Ananya Joshi', studentId: '23BCE201', isVolunteer: true },
    { email: 'volunteer2@nirmauni.ac.in', name: 'Kabir Verma', studentId: '23BCE202', isVolunteer: true },
    { email: 'student1@nirmauni.ac.in', name: 'Pooja Trivedi', studentId: '23BCE301' },
    { email: 'student2@nirmauni.ac.in', name: 'Harsh Dave', studentId: '23BCE302' },
  ];

  const createdUsers = {};
  for (const def of userDefs) {
    const user = await prisma.user.upsert({
      where: { email: def.email },
      update: {},
      create: {
        email: def.email,
        name: def.name,
        studentId: def.studentId,
        passwordHash,
        emailVerifiedAt: new Date(),
      },
    });
    createdUsers[def.email] = user;

    // Role assignment
    if (def.role) {
      const existingRole = await prisma.roleAssignment.findFirst({
        where: { userId: user.id, role: def.role, endedAt: null },
      });
      if (!existingRole) {
        await prisma.roleAssignment.create({
          data: {
            userId: user.id,
            role: def.role,
            termStart: new Date(),
            termEnd: new Date(Date.now() + 365 * 24 * 3600000),
            source: 'SYSTEM',
            reason: 'Initial demo seed',
            createdById: user.id,
          },
        });
      }
    }

    // Volunteer registration (Scene 5)
    if (def.isVolunteer) {
      await prisma.volunteer.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          status: 'ACTIVE',
          skills: ['event_setup', 'baking', 'logistics', 'door_checkin'],
        },
      });
    }

    // Active membership for president, treasurer, and student1
    if (['president@nirmauni.ac.in', 'treasurer@nirmauni.ac.in', 'student1@nirmauni.ac.in'].includes(def.email)) {
      const existingMembership = await prisma.membership.findFirst({
        where: { userId: user.id, status: 'ACTIVE' },
      });
      if (!existingMembership) {
        await prisma.membership.create({
          data: {
            userId: user.id,
            tierId: annualTier.id,
            status: 'ACTIVE',
            source: 'ONLINE',
            startsAt: new Date(),
            expiresAt: new Date(Date.now() + 365 * 24 * 3600000),
          },
        });
      }
    }
  }

  // 3. Seed Events & Tickets (Scene 2: Spring Gala)
  const gala = await prisma.event.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      title: 'Spring Gala 2026',
      description: 'The biggest flagship cultural and networking celebration of the semester.',
      category: 'GALA',
      venue: 'University Grand Auditorium',
      startAt: new Date(Date.now() + 14 * 24 * 3600000),
      endAt: new Date(Date.now() + 14 * 24 * 3600000 + 4 * 3600000),
      capacity: 350,
      seatsSold: 0,
      visibility: 'PUBLIC',
      status: 'PUBLISHED',
      proposedById: createdUsers['eventhead@nirmauni.ac.in'].id,
      ticketTypes: {
        create: [
          {
            name: 'Member Early Bird Ticket',
            audience: 'MEMBER',
            pricePaise: BigInt(15000), // ₹150
            quota: 200,
            maxPerUser: 2,
            salesStartAt: new Date(),
            salesEndAt: new Date(Date.now() + 14 * 24 * 3600000),
          },
          {
            name: 'General Admission (Non-Member)',
            audience: 'NON_MEMBER',
            pricePaise: BigInt(30000), // ₹300
            quota: 150,
            maxPerUser: 4,
            salesStartAt: new Date(),
            salesEndAt: new Date(Date.now() + 14 * 24 * 3600000),
          },
        ],
      },
    },
  });

  // 4. Seed Merchandise (Scene 4: Ordering Hoodies)
  const hoodie = await prisma.product.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Skyline Club Signature Hoodie',
      description: 'Navy hoodie with golden Skyline crest.',
      status: 'ACTIVE',
      category: 'APPAREL',
      memberPricePaise: BigInt(89900),
      nonMemberPricePaise: BigInt(119900),
      variants: {
        create: [
          { sku: 'HD-NAVY-S', size: 'S', color: 'Navy', stock: 30, reserved: 0 },
          { sku: 'HD-NAVY-M', size: 'M', color: 'Navy', stock: 50, reserved: 0 },
          { sku: 'HD-NAVY-L', size: 'L', color: 'Navy', stock: 50, reserved: 0 },
          { sku: 'HD-NAVY-XL', size: 'XL', color: 'Navy', stock: 25, reserved: 0 },
        ],
      },
    },
  });

  // 5. Seed Fundraiser Project & Tasks (Scene 5: Planning a Fundraiser)
  const bakeSale = await prisma.project.upsert({
    where: { id: '00000000-0000-0000-0000-000000000003' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      name: 'Campus Bake Sale Fundraiser',
      description: 'Raise funds for the club by selling homemade pastries and drinks on campus.',
      type: 'FUNDRAISER',
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 3600000),
      ownerId: createdUsers['president@nirmauni.ac.in'].id,
      tasks: {
        create: [
          {
            title: 'Bake cookies and brownies',
            description: 'Prepare 100 packages of assorted baked goods.',
            priority: 'HIGH',
            status: 'IN_PROGRESS',
            dueAt: new Date(Date.now() + 5 * 24 * 3600000),
            createdById: createdUsers['president@nirmauni.ac.in'].id,
          },
          {
            title: 'Buy packaging boxes and napkins',
            description: 'Purchase supplies from supermarket and retain receipt.',
            priority: 'MEDIUM',
            status: 'TODO',
            dueAt: new Date(Date.now() + 3 * 24 * 3600000),
            createdById: createdUsers['president@nirmauni.ac.in'].id,
          },
          {
            title: 'Manage sales table at Student Plaza',
            description: 'Staff the table from 11:00 AM to 3:00 PM.',
            priority: 'HIGH',
            status: 'TODO',
            dueAt: new Date(Date.now() + 7 * 24 * 3600000),
            createdById: createdUsers['president@nirmauni.ac.in'].id,
          },
        ],
      },
    },
  });

  // 6. Seed Ledger Allocation & Sample Claims (Commerce Phase 6)
  const allocation = await prisma.budgetAllocation.create({
    data: {
      period: 'AY2025-26',
      amountPaise: BigInt(25000000), // ₹2,50,000 opening balance
      source: 'University Grant',
      note: 'Initial semester club grant',
      allocatedById: createdUsers['mentor@nirmauni.ac.in'].id,
    },
  });

  await prisma.ledgerEntry.create({
    data: {
      direction: 'IN',
      category: 'BUDGET_ALLOCATION',
      amountPaise: BigInt(25000000),
      sourceType: 'ALLOCATION',
      sourceId: allocation.id,
      description: 'Opening Budget Allocation',
      recordedById: createdUsers['mentor@nirmauni.ac.in'].id,
      occurredAt: new Date(),
    }
  });

  await prisma.expenseClaim.create({
    data: {
      submittedById: createdUsers['president@nirmauni.ac.in'].id,
      amountPaise: BigInt(250000), // ₹2,500
      description: 'Bake Sale packaging supplies (boxes, napkins, wrappers)',
      status: 'SUBMITTED',
      spentAt: new Date(),
    }
  });

  // 7. Seed Official Announcements
  await prisma.announcement.upsert({
    where: { id: '00000000-0000-0000-0000-000000000010' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000010',
      title: 'Welcome to the New Skyline Organization Platform!',
      bodyMd: 'We are thrilled to launch the new centralized platform for LDCE & Nirma students. Access digital membership cards, discounted event tickets, official hoodies, and transparent student governance all in one place.',
      audience: 'PUBLIC',
      status: 'PUBLISHED',
      publishedAt: new Date(),
      authorId: createdUsers['president@nirmauni.ac.in'].id,
    },
  });

  await prisma.announcement.upsert({
    where: { id: '00000000-0000-0000-0000-000000000011' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000011',
      title: 'Spring Gala 2026 Ticket Sales Now Live',
      bodyMd: 'Early bird tickets for the flagship Spring Gala 2026 are now open for verified members at 50% discount. Make sure to claim your tickets early before quotas fill up.',
      audience: 'MEMBERS',
      status: 'PUBLISHED',
      publishedAt: new Date(),
      authorId: createdUsers['eventhead@nirmauni.ac.in'].id,
    },
  });

  console.log('Seeding completed successfully!');
  console.log(`Demo user accounts created (default password: "${defaultPassword}"):`);
  console.log('  - Mentor:     mentor@nirmauni.ac.in');
  console.log('  - President:  president@nirmauni.ac.in');
  console.log('  - Treasurer:  treasurer@nirmauni.ac.in');
  console.log('  - Event Head: eventhead@nirmauni.ac.in');
  console.log('  - Volunteer:  volunteer1@nirmauni.ac.in');
  console.log('  - Student:    student1@nirmauni.ac.in');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
