import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/security.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Skyline Student Association database with full realistic data...');

  const defaultPassword = process.env.SEED_PASSWORD || 'Password123!';
  const passwordHash = await hashPassword(defaultPassword);

  // 1. Club Settings
  const settings = [
    { key: 'club.name', value: 'Skyline Student Association' },
    { key: 'club.academicYearEnd', value: '05-31' },
    { key: 'membership.renewalWindowDays', value: '30' },
    { key: 'currency.code', value: 'INR' },
    { key: 'currency.symbol', value: '₹' },
  ];
  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: { key: s.key, value: s.value },
    });
  }
  console.log('✓ Seeded club settings');

  // 2. Membership Tiers
  const annualTier = await prisma.membershipTier.upsert({
    where: { name: 'Annual Membership' },
    update: { pricePaise: BigInt(50000), isActive: true },
    create: {
      name: 'Annual Membership',
      pricePaise: BigInt(50000), // ₹500
      durationType: 'ACADEMIC_YEAR',
      benefits: { discountPercent: 20, accessAllEvents: true, votingRights: true },
      isActive: true,
    },
  });

  const semesterTier = await prisma.membershipTier.upsert({
    where: { name: 'Semester Membership' },
    update: { pricePaise: BigInt(30000), isActive: true },
    create: {
      name: 'Semester Membership',
      pricePaise: BigInt(30000), // ₹300
      durationType: 'SEMESTER',
      benefits: { discountPercent: 10, accessAllEvents: true, votingRights: false },
      isActive: true,
    },
  });
  console.log('✓ Seeded membership tiers');

  // 3. Users & Core Accounts
  const userDefs = [
    { id: '10000000-0000-0000-0000-000000000001', email: 'mentor@nirmauni.ac.in', name: 'Dr. Mentor Sharma', studentId: 'FACULTY-001', role: 'MENTOR' },
    { id: '10000000-0000-0000-0000-000000000002', email: 'president@nirmauni.ac.in', name: 'Aarav Patel', studentId: '22BCE101', role: 'PRESIDENT', isMember: true },
    { id: '10000000-0000-0000-0000-000000000003', email: 'treasurer@nirmauni.ac.in', name: 'Diya Shah', studentId: '22BCE102', role: 'TREASURER', isMember: true },
    { id: '10000000-0000-0000-0000-000000000004', email: 'eventhead@nirmauni.ac.in', name: 'Rohan Mehta', studentId: '22BCE103', role: 'EVENT_HEAD', isMember: true },
    { id: '10000000-0000-0000-0000-000000000005', email: 'volunteerhead@nirmauni.ac.in', name: 'Sanya Kapoor', studentId: '22BCE104', role: 'VOLUNTEER_HEAD', isMember: true },
    { id: '10000000-0000-0000-0000-000000000006', email: 'marketinghead@nirmauni.ac.in', name: 'Vikram Rathore', studentId: '22BCE105', role: 'MARKETING_HEAD', isMember: true },
    { id: '10000000-0000-0000-0000-000000000007', email: 'door@nirmauni.ac.in', name: 'Karan Singhania', studentId: '23BCE150', role: 'DOOR_VOLUNTEER', isVolunteer: true, isMember: true },
    { id: '10000000-0000-0000-0000-000000000008', email: 'cashdesk@nirmauni.ac.in', name: 'Neha Desai', studentId: '23BCE160', role: 'CASH_DESK', isVolunteer: true, isMember: true },
    { id: '10000000-0000-0000-0000-000000000009', email: 'volunteer1@nirmauni.ac.in', name: 'Ananya Joshi', studentId: '23BCE201', isVolunteer: true, isMember: true },
    { id: '10000000-0000-0000-0000-000000000010', email: 'volunteer2@nirmauni.ac.in', name: 'Kabir Verma', studentId: '23BCE202', isVolunteer: true },
    { id: '10000000-0000-0000-0000-000000000011', email: 'volunteer3@nirmauni.ac.in', name: 'Rhea Sen', studentId: '23BCE203', isVolunteer: true },
    { id: '10000000-0000-0000-0000-000000000012', email: 'student1@nirmauni.ac.in', name: 'Pooja Trivedi', studentId: '23BCE301', isMember: true },
    { id: '10000000-0000-0000-0000-000000000013', email: 'student2@nirmauni.ac.in', name: 'Harsh Dave', studentId: '23BCE302', isMember: true, isSemesterMember: true },
    { id: '10000000-0000-0000-0000-000000000014', email: 'student3@nirmauni.ac.in', name: 'Meera Nair', studentId: '23BCE303', isMember: true },
    { id: '10000000-0000-0000-0000-000000000015', email: 'student4@nirmauni.ac.in', name: 'Devansh Bhatt', studentId: '24BCE401' },
  ];

  const createdUsers = {};
  for (const def of userDefs) {
    const user = await prisma.user.upsert({
      where: { email: def.email },
      update: { name: def.name, studentId: def.studentId },
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
            reason: 'Leadership appointment for academic year',
            createdById: user.id,
          },
        });
      }
    }

    // Volunteer registration
    if (def.isVolunteer) {
      await prisma.volunteer.upsert({
        where: { userId: user.id },
        update: { status: 'ACTIVE' },
        create: {
          userId: user.id,
          status: 'ACTIVE',
          skills: ['event_setup', 'baking', 'logistics', 'door_checkin', 'stage_management'],
        },
      });
    }

    // Active Membership
    if (def.isMember) {
      const existingMembership = await prisma.membership.findFirst({
        where: { userId: user.id, status: 'ACTIVE' },
      });
      if (!existingMembership) {
        await prisma.membership.create({
          data: {
            userId: user.id,
            tierId: def.isSemesterMember ? semesterTier.id : annualTier.id,
            status: 'ACTIVE',
            source: 'ONLINE',
            startsAt: new Date(),
            expiresAt: new Date(Date.now() + (def.isSemesterMember ? 180 : 365) * 24 * 3600000),
          },
        });
      }
    }
  }
  console.log('✓ Seeded users, roles, memberships, and volunteers');

  // Helper for Events
  async function upsertEvent({ id, title, description, category, venue, startAt, endAt, capacity, visibility, proposedById, ticketTypes }) {
    const event = await prisma.event.upsert({
      where: { id },
      update: { title, description, category, venue, startAt, endAt, capacity, visibility, status: 'PUBLISHED' },
      create: { id, title, description, category, venue, startAt, endAt, capacity, seatsSold: 0, visibility, status: 'PUBLISHED', proposedById },
    });

    for (const tt of ticketTypes) {
      await prisma.ticketType.upsert({
        where: { id: tt.id },
        update: { name: tt.name, audience: tt.audience, pricePaise: tt.pricePaise, quota: tt.quota, maxPerUser: tt.maxPerUser },
        create: {
          id: tt.id,
          eventId: event.id,
          name: tt.name,
          audience: tt.audience,
          pricePaise: tt.pricePaise,
          quota: tt.quota,
          maxPerUser: tt.maxPerUser,
          salesStartAt: tt.salesStartAt ?? new Date(),
          salesEndAt: tt.salesEndAt ?? event.endAt,
        },
      });
    }
    return event;
  }

  // 4. Events & Ticket Types
  const gala = await upsertEvent({
    id: '00000000-0000-0000-0000-000000000001',
    title: 'Spring Gala 2026',
    description: 'The premier flagship cultural evening and networking celebration of LDCE & Nirma University.',
    category: 'GALA',
    venue: 'University Grand Auditorium',
    startAt: new Date(Date.now() + 14 * 24 * 3600000),
    endAt: new Date(Date.now() + 14 * 24 * 3600000 + 4 * 3600000),
    capacity: 350,
    visibility: 'PUBLIC',
    proposedById: createdUsers['eventhead@nirmauni.ac.in'].id,
    ticketTypes: [
      {
        id: '31000000-0000-0000-0000-000000000001',
        name: 'Member Early Bird Ticket',
        audience: 'MEMBER',
        pricePaise: BigInt(15000), // ₹150
        quota: 200,
        maxPerUser: 2,
        salesStartAt: new Date(),
        salesEndAt: new Date(Date.now() + 14 * 24 * 3600000),
      },
      {
        id: '31000000-0000-0000-0000-000000000002',
        name: 'General Admission (Non-Member)',
        audience: 'NON_MEMBER',
        pricePaise: BigInt(30000), // ₹300
        quota: 150,
        maxPerUser: 4,
        salesStartAt: new Date(),
        salesEndAt: new Date(Date.now() + 14 * 24 * 3600000),
      },
      {
        id: '31000000-0000-0000-0000-000000000003',
        name: 'VIP Front Row Pass',
        audience: 'ALL',
        pricePaise: BigInt(100000), // ₹1,000
        quota: 25,
        maxPerUser: 2,
        salesStartAt: new Date(),
        salesEndAt: new Date(Date.now() + 14 * 24 * 3600000),
      },
    ],
  });

  const hackathon = await upsertEvent({
    id: '30000000-0000-0000-0000-000000000002',
    title: 'CodeWave LDCE Hackathon 2026',
    description: '36-hour student hackathon building open solutions in AI, campus mobility, and fintech.',
    category: 'HACKATHON',
    venue: 'Computer Engineering Department Labs',
    startAt: new Date(Date.now() + 28 * 24 * 3600000),
    endAt: new Date(Date.now() + 30 * 24 * 3600000),
    capacity: 200,
    visibility: 'PUBLIC',
    proposedById: createdUsers['eventhead@nirmauni.ac.in'].id,
    ticketTypes: [
      {
        id: '31000000-0000-0000-0000-000000000010',
        name: 'Hacker Pass (Free Entry)',
        audience: 'ALL',
        pricePaise: BigInt(0),
        quota: 150,
        maxPerUser: 1,
        salesStartAt: new Date(),
        salesEndAt: new Date(Date.now() + 25 * 24 * 3600000),
      },
      {
        id: '31000000-0000-0000-0000-000000000011',
        name: 'Project Demo & Showcase Pass',
        audience: 'ALL',
        pricePaise: BigInt(15000), // ₹150
        quota: 50,
        maxPerUser: 2,
        salesStartAt: new Date(),
        salesEndAt: new Date(Date.now() + 27 * 24 * 3600000),
      },
    ],
  });

  const workshop = await upsertEvent({
    id: '30000000-0000-0000-0000-000000000003',
    title: 'Leadership & Venture Strategy Workshop',
    description: 'Hands-on session with industry founders on organizational scaling and financial planning.',
    category: 'WORKSHOP',
    venue: 'Seminar Hall 3, Management Block',
    startAt: new Date(Date.now() + 7 * 24 * 3600000),
    endAt: new Date(Date.now() + 7 * 24 * 3600000 + 3 * 3600000),
    capacity: 100,
    visibility: 'PUBLIC',
    proposedById: createdUsers['president@nirmauni.ac.in'].id,
    ticketTypes: [
      {
        id: '31000000-0000-0000-0000-000000000020',
        name: 'Member Workshop Pass',
        audience: 'MEMBER',
        pricePaise: BigInt(5000), // ₹50
        quota: 60,
        maxPerUser: 1,
        salesStartAt: new Date(),
        salesEndAt: new Date(Date.now() + 6 * 24 * 3600000),
      },
      {
        id: '31000000-0000-0000-0000-000000000021',
        name: 'Guest Workshop Pass',
        audience: 'NON_MEMBER',
        pricePaise: BigInt(15000), // ₹150
        quota: 40,
        maxPerUser: 2,
        salesStartAt: new Date(),
        salesEndAt: new Date(Date.now() + 6 * 24 * 3600000),
      },
    ],
  });

  // Seed sample issued tickets
  const galaTicketType = await prisma.ticketType.findFirst({ where: { eventId: gala.id } });
  if (galaTicketType) {
    await prisma.ticket.upsert({
      where: { id: '32000000-0000-0000-0000-000000000001' },
      update: {},
      create: {
        id: '32000000-0000-0000-0000-000000000001',
        eventId: gala.id,
        ticketTypeId: galaTicketType.id,
        userId: createdUsers['student1@nirmauni.ac.in'].id,
        pricePaidPaise: galaTicketType.pricePaise,
        status: 'ISSUED',
      },
    });

    await prisma.ticket.upsert({
      where: { id: '32000000-0000-0000-0000-000000000002' },
      update: {},
      create: {
        id: '32000000-0000-0000-0000-000000000002',
        eventId: gala.id,
        ticketTypeId: galaTicketType.id,
        userId: createdUsers['student2@nirmauni.ac.in'].id,
        pricePaidPaise: galaTicketType.pricePaise,
        status: 'CHECKED_IN',
        checkedInAt: new Date(),
        checkedInById: createdUsers['door@nirmauni.ac.in'].id,
      },
    });
  }
  console.log('✓ Seeded events, ticket types, and sample tickets');

  // Helper for Products & Variants
  async function upsertProduct({ id, name, description, category, memberPricePaise, nonMemberPricePaise, variants }) {
    const product = await prisma.product.upsert({
      where: { id },
      update: { name, description, category, memberPricePaise, nonMemberPricePaise, status: 'ACTIVE' },
      create: { id, name, description, category, memberPricePaise, nonMemberPricePaise, status: 'ACTIVE' },
    });

    for (const v of variants) {
      await prisma.variant.upsert({
        where: { sku: v.sku },
        update: { productId: product.id, size: v.size, color: v.color, stock: v.stock, reserved: v.reserved ?? 0 },
        create: {
          id: v.id,
          productId: product.id,
          sku: v.sku,
          size: v.size,
          color: v.color,
          stock: v.stock,
          reserved: v.reserved ?? 0,
        },
      });
    }
    return product;
  }

  // 5. Merchandise & Products
  const hoodie = await upsertProduct({
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Skyline Club Signature Hoodie',
    description: 'Heavyweight premium navy blue fleece hoodie featuring the golden embroidered Skyline crest.',
    category: 'APPAREL',
    memberPricePaise: BigInt(89900), // ₹899
    nonMemberPricePaise: BigInt(119900), // ₹1,199
    variants: [
      { id: '41000000-0000-0000-0000-000000000001', sku: 'HD-NAVY-S', size: 'S', color: 'Navy Blue', stock: 25, reserved: 2 },
      { id: '41000000-0000-0000-0000-000000000002', sku: 'HD-NAVY-M', size: 'M', color: 'Navy Blue', stock: 45, reserved: 5 },
      { id: '41000000-0000-0000-0000-000000000003', sku: 'HD-NAVY-L', size: 'L', color: 'Navy Blue', stock: 50, reserved: 3 },
      { id: '41000000-0000-0000-0000-000000000004', sku: 'HD-NAVY-XL', size: 'XL', color: 'Navy Blue', stock: 20, reserved: 0 },
    ],
  });

  const tshirt = await upsertProduct({
    id: '40000000-0000-0000-0000-000000000002',
    name: 'Skyline Minimalist Tech Tee',
    description: '100% combed cotton jersey t-shirt with matte black typographic skyline print.',
    category: 'APPAREL',
    memberPricePaise: BigInt(39900), // ₹399
    nonMemberPricePaise: BigInt(59900), // ₹599
    variants: [
      { id: '41000000-0000-0000-0000-000000000010', sku: 'TS-BLK-S', size: 'S', color: 'Matte Black', stock: 30, reserved: 0 },
      { id: '41000000-0000-0000-0000-000000000011', sku: 'TS-BLK-M', size: 'M', color: 'Matte Black', stock: 60, reserved: 1 },
      { id: '41000000-0000-0000-0000-000000000012', sku: 'TS-BLK-L', size: 'L', color: 'Matte Black', stock: 50, reserved: 0 },
    ],
  });

  const flask = await upsertProduct({
    id: '40000000-0000-0000-0000-000000000003',
    name: 'Insulated Stainless Steel Flask (750ml)',
    description: 'Double-walled vacuum insulated water bottle keeping drinks hot for 12h or cold for 24h.',
    category: 'ACCESSORIES',
    memberPricePaise: BigInt(45000), // ₹450
    nonMemberPricePaise: BigInt(65000), // ₹650
    variants: [
      { id: '41000000-0000-0000-0000-000000000020', sku: 'FLASK-SLV', size: '750ml', color: 'Brushed Silver', stock: 40, reserved: 0 },
      { id: '41000000-0000-0000-0000-000000000021', sku: 'FLASK-BLK', size: '750ml', color: 'Matte Midnight', stock: 35, reserved: 0 },
    ],
  });

  // Seed sample order for student1
  const hoodieVariant = await prisma.variant.findFirst({ where: { productId: hoodie.id, size: 'M' } });
  if (hoodieVariant) {
    const existingOrder = await prisma.order.findFirst({
      where: { userId: createdUsers['student1@nirmauni.ac.in'].id },
    });
    if (!existingOrder) {
      await prisma.order.create({
        data: {
          id: '42000000-0000-0000-0000-000000000001',
          userId: createdUsers['student1@nirmauni.ac.in'].id,
          status: 'PAID',
          totalPaise: BigInt(89900),
          items: {
            create: [
              {
                variantId: hoodieVariant.id,
                quantity: 1,
                unitPricePaise: BigInt(89900),
              },
            ],
          },
        },
      });
    }
  }
  console.log('✓ Seeded merchandise products, variants, and sample order');

  // Helper for Projects & Tasks
  async function upsertProject({ id, name, description, type, eventId, ownerId, startDate, endDate, tasks }) {
    const sDate = startDate || new Date();
    const eDate = endDate || new Date(Date.now() + 60 * 24 * 3600000);
    const project = await prisma.project.upsert({
      where: { id },
      update: { name, description, type, status: 'ACTIVE', startDate: sDate, endDate: eDate },
      create: { id, name, description, type, status: 'ACTIVE', eventId, ownerId, startDate: sDate, endDate: eDate },
    });

    for (const t of tasks) {
      const task = await prisma.task.upsert({
        where: { id: t.id },
        update: { title: t.title, description: t.description, priority: t.priority, status: t.status, dueAt: t.dueAt || t.dueDate || new Date(Date.now() + 7 * 24 * 3600000) },
        create: {
          id: t.id,
          projectId: project.id,
          title: t.title,
          description: t.description,
          priority: t.priority,
          status: t.status,
          dueAt: t.dueAt || t.dueDate || new Date(Date.now() + 7 * 24 * 3600000),
          createdById: t.createdById,
        },
      });

      if (t.assigneeUserIds) {
        for (const userId of t.assigneeUserIds) {
          const existing = await prisma.taskAssignee.findFirst({
            where: { taskId: task.id, userId },
          });
          if (!existing) {
            await prisma.taskAssignee.create({
              data: { taskId: task.id, userId },
            });
          }
        }
      }
    }
    return project;
  }

  // 6. Projects & Tasks
  const bakeSale = await upsertProject({
    id: '00000000-0000-0000-0000-000000000003',
    name: 'Campus Bake Sale Fundraiser',
    description: 'Raise funds for the club by selling homemade pastries, cookies, and iced teas on campus.',
    type: 'FUNDRAISER',
    ownerId: createdUsers['president@nirmauni.ac.in'].id,
    tasks: [
      {
        id: '51000000-0000-0000-0000-000000000001',
        title: 'Bake cookies and brownies',
        description: 'Prepare 100 packages of assorted baked goods for the campus bake sale fundraiser.',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        dueDate: new Date(Date.now() + 5 * 24 * 3600000),
        createdById: createdUsers['president@nirmauni.ac.in'].id,
        assigneeUserIds: [
          createdUsers['volunteer1@nirmauni.ac.in'].id,
          createdUsers['volunteer2@nirmauni.ac.in'].id,
        ],
      },
      {
        id: '51000000-0000-0000-0000-000000000002',
        title: 'Buy packaging boxes and napkins',
        description: 'Purchase supplies from local wholesale market and submit receipt for reimbursement.',
        priority: 'MEDIUM',
        status: 'TODO',
        dueDate: new Date(Date.now() + 3 * 24 * 3600000),
        createdById: createdUsers['president@nirmauni.ac.in'].id,
        assigneeUserIds: [createdUsers['volunteer3@nirmauni.ac.in'].id],
      },
      {
        id: '51000000-0000-0000-0000-000000000003',
        title: 'Manage sales table at Student Plaza',
        description: 'Staff the table from 11:00 AM to 3:00 PM, manage cash desk and UPI QR stands.',
        priority: 'HIGH',
        status: 'TODO',
        dueDate: new Date(Date.now() + 7 * 24 * 3600000),
        createdById: createdUsers['president@nirmauni.ac.in'].id,
        assigneeUserIds: [createdUsers['cashdesk@nirmauni.ac.in'].id],
      },
    ],
  });

  const galaProject = await upsertProject({
    id: '50000000-0000-0000-0000-000000000002',
    name: 'Spring Gala Production & Logistics',
    description: 'End-to-end event execution covering stage, lighting, VIP guest coordination, and door verification.',
    type: 'EVENT_PREP',
    eventId: gala.id,
    ownerId: createdUsers['eventhead@nirmauni.ac.in'].id,
    tasks: [
      {
        id: '51000000-0000-0000-0000-000000000010',
        title: 'Sound system check and wireless mic configuration',
        description: 'Coordinate with auditorium sound engineer for acoustic balances and lapel mics.',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        dueDate: new Date(Date.now() + 12 * 24 * 3600000),
        createdById: createdUsers['eventhead@nirmauni.ac.in'].id,
        assigneeUserIds: [createdUsers['volunteer2@nirmauni.ac.in'].id],
      },
      {
        id: '51000000-0000-0000-0000-000000000011',
        title: 'Setup mobile QR scanner stations at entry gates',
        description: 'Deploy scanners on phones of 4 door volunteers and perform dry run check-ins.',
        priority: 'HIGH',
        status: 'TODO',
        dueDate: new Date(Date.now() + 13 * 24 * 3600000),
        createdById: createdUsers['eventhead@nirmauni.ac.in'].id,
        assigneeUserIds: [createdUsers['door@nirmauni.ac.in'].id],
      },
    ],
  });
  console.log('✓ Seeded projects, tasks, and task assignees');

  // 7. Finance: Budget Limits, Allocations, Ledger, Cash Collections, Claims
  const budgetLimits = [
    { category: 'DUES', limitPaise: BigInt(50000000) }, // ₹5,00,000
    { category: 'TICKETS', limitPaise: BigInt(30000000) }, // ₹3,00,000
    { category: 'MERCH', limitPaise: BigInt(20000000) }, // ₹2,00,000
    { category: 'FUNDRAISER', limitPaise: BigInt(15000000) }, // ₹1,50,000
    { category: 'BUDGET_ALLOCATION', limitPaise: BigInt(50000000) }, // ₹5,00,000
    { category: 'REIMBURSEMENT', limitPaise: BigInt(10000000) }, // ₹1,00,000
    { category: 'PURCHASE', limitPaise: BigInt(25000000) }, // ₹2,50,000
  ];
  for (const bl of budgetLimits) {
    await prisma.budgetLimit.upsert({
      where: { period_category: { period: 'AY2025-26', category: bl.category } },
      update: { limitPaise: bl.limitPaise },
      create: {
        period: 'AY2025-26',
        category: bl.category,
        limitPaise: bl.limitPaise,
      },
    });
  }

  const allocation = await prisma.budgetAllocation.create({
    data: {
      period: 'AY2025-26',
      amountPaise: BigInt(30000000), // ₹3,00,000
      source: 'UNIVERSITY_GRANT',
      note: 'Annual University Grant for student club activities and operations',
      allocatedById: createdUsers['mentor@nirmauni.ac.in'].id,
    },
  });

  // Seed ledger entries
  const existingLedger = await prisma.ledgerEntry.count();
  if (existingLedger <= 1) {
    await prisma.ledgerEntry.createMany({
      data: [
        {
          direction: 'IN',
          category: 'BUDGET_ALLOCATION',
          amountPaise: BigInt(30000000),
          sourceType: 'ALLOCATION',
          sourceId: allocation.id,
          description: 'University Grant AY2025-26 initial allocation',
          recordedById: createdUsers['mentor@nirmauni.ac.in'].id,
          occurredAt: new Date(Date.now() - 30 * 24 * 3600000),
        },
        {
          direction: 'IN',
          category: 'DUES',
          amountPaise: BigInt(4500000), // ₹45,000
          sourceType: 'PAYMENT',
          sourceId: '90000000-0000-0000-0000-000000000001',
          description: 'Annual membership dues batch receipt (90 members)',
          recordedById: createdUsers['treasurer@nirmauni.ac.in'].id,
          occurredAt: new Date(Date.now() - 20 * 24 * 3600000),
        },
        {
          direction: 'IN',
          category: 'TICKETS',
          amountPaise: BigInt(3750000), // ₹37,500
          sourceType: 'PAYMENT',
          sourceId: '90000000-0000-0000-0000-000000000002',
          eventId: gala.id,
          description: 'Spring Gala 2026 early bird tickets online batch',
          recordedById: createdUsers['treasurer@nirmauni.ac.in'].id,
          occurredAt: new Date(Date.now() - 10 * 24 * 3600000),
        },
        {
          direction: 'IN',
          category: 'MERCH',
          amountPaise: BigInt(5394000), // ₹53,940
          sourceType: 'PAYMENT',
          sourceId: '90000000-0000-0000-0000-000000000003',
          description: 'Signature Hoodie pre-order payments (60 units)',
          recordedById: createdUsers['treasurer@nirmauni.ac.in'].id,
          occurredAt: new Date(Date.now() - 5 * 24 * 3600000),
        },
        {
          direction: 'IN',
          category: 'FUNDRAISER',
          amountPaise: BigInt(1840000), // ₹18,400
          sourceType: 'CASH_COLLECTION',
          sourceId: '90000000-0000-0000-0000-000000000004',
          projectId: bakeSale.id,
          description: 'Campus Bake Sale day 1 revenue deposit',
          recordedById: createdUsers['treasurer@nirmauni.ac.in'].id,
          occurredAt: new Date(Date.now() - 2 * 24 * 3600000),
        },
        {
          direction: 'OUT',
          category: 'PURCHASE',
          amountPaise: BigInt(5000000), // ₹50,000
          sourceType: 'MANUAL',
          sourceId: '90000000-0000-0000-0000-000000000005',
          eventId: gala.id,
          description: 'Grand Auditorium booking advance payment to LDCE Estate office',
          recordedById: createdUsers['treasurer@nirmauni.ac.in'].id,
          occurredAt: new Date(Date.now() - 12 * 24 * 3600000),
        },
        {
          direction: 'OUT',
          category: 'PURCHASE',
          amountPaise: BigInt(3500000), // ₹35,000
          sourceType: 'MANUAL',
          sourceId: '90000000-0000-0000-0000-000000000006',
          eventId: gala.id,
          description: 'Stage lighting and AV vendor contract deposit',
          recordedById: createdUsers['treasurer@nirmauni.ac.in'].id,
          occurredAt: new Date(Date.now() - 8 * 24 * 3600000),
        },
        {
          direction: 'OUT',
          category: 'REIMBURSEMENT',
          amountPaise: BigInt(480000), // ₹4,800
          sourceType: 'CLAIM',
          sourceId: '90000000-0000-0000-0000-000000000007',
          description: 'Reimbursement: Welcome banners, ID badges, and standees',
          recordedById: createdUsers['treasurer@nirmauni.ac.in'].id,
          occurredAt: new Date(Date.now() - 4 * 24 * 3600000),
        },
      ],
    });
  }

  // Cash collections
  await prisma.cashCollection.createMany({
    data: [
      {
        collectedById: createdUsers['cashdesk@nirmauni.ac.in'].id,
        payerUserId: createdUsers['student4@nirmauni.ac.in'].id,
        refId: '90000000-0000-0000-0000-000000000020',
        amountPaise: BigInt(50000), // ₹500
        purpose: 'MEMBERSHIP',
        status: 'PENDING_VERIFICATION',
      },
      {
        collectedById: createdUsers['door@nirmauni.ac.in'].id,
        refId: '90000000-0000-0000-0000-000000000021',
        amountPaise: BigInt(300000), // ₹3,000
        purpose: 'TICKET',
        status: 'PENDING_VERIFICATION',
      },
      {
        collectedById: createdUsers['cashdesk@nirmauni.ac.in'].id,
        refId: '90000000-0000-0000-0000-000000000022',
        amountPaise: BigInt(119800), // ₹1,198
        purpose: 'MERCH',
        status: 'VERIFIED',
        verifiedById: createdUsers['treasurer@nirmauni.ac.in'].id,
        verifiedAt: new Date(),
      },
    ],
    skipDuplicates: true,
  });

  // Expense claims
  const sampleClaims = [
    {
      id: '60000000-0000-0000-0000-000000000001',
      submittedById: createdUsers['volunteer1@nirmauni.ac.in'].id,
      amountPaise: BigInt(250000), // ₹2,500
      category: 'REIMBURSEMENT',
      route: 'STANDARD',
      description: 'Bake Sale packaging supplies: airtight boxes, napkins, ribbons',
      status: 'SUBMITTED',
      spentAt: new Date(Date.now() - 2 * 24 * 3600000),
      projectId: bakeSale.id,
    },
    {
      id: '60000000-0000-0000-0000-000000000002',
      submittedById: createdUsers['eventhead@nirmauni.ac.in'].id,
      amountPaise: BigInt(420000), // ₹4,200
      category: 'REIMBURSEMENT',
      route: 'STANDARD',
      description: 'Hardware ethernet patch cables and power extensions for Hackathon lab',
      status: 'SUBMITTED',
      spentAt: new Date(Date.now() - 3 * 24 * 3600000),
      eventId: hackathon.id,
    },
    {
      id: '60000000-0000-0000-0000-000000000003',
      submittedById: createdUsers['volunteer2@nirmauni.ac.in'].id,
      amountPaise: BigInt(180000), // ₹1,800
      category: 'REIMBURSEMENT',
      route: 'STANDARD',
      description: 'Certificates thick cardstock printing and official wax seal stamp',
      status: 'APPROVED',
      spentAt: new Date(Date.now() - 5 * 24 * 3600000),
    },
    {
      id: '60000000-0000-0000-0000-000000000004',
      submittedById: createdUsers['president@nirmauni.ac.in'].id,
      amountPaise: BigInt(95000), // ₹950
      category: 'REIMBURSEMENT',
      route: 'STANDARD',
      description: 'Refreshments, green tea, and dry snacks for guest speaker',
      status: 'PAID',
      paidAt: new Date(Date.now() - 1 * 24 * 3600000),
      paidMethod: 'BANK_TRANSFER',
      paidReference: 'TXN-REF-902188',
      spentAt: new Date(Date.now() - 6 * 24 * 3600000),
    },
  ];

  for (const c of sampleClaims) {
    await prisma.expenseClaim.upsert({
      where: { id: c.id },
      update: { status: c.status, description: c.description },
      create: c,
    });
  }
  console.log('✓ Seeded budget limits, allocations, ledger entries, cash collections, and claims');

  // 8. Governance: Elections & Selection Cycles
  const cycle = await prisma.selectionCycle.upsert({
    where: { id: '70000000-0000-0000-0000-000000000001' },
    update: { status: 'OPEN' },
    create: {
      id: '70000000-0000-0000-0000-000000000001',
      title: 'Executive Council Selection 2026–2027',
      termStart: new Date('2026-06-01T00:00:00Z'),
      termEnd: new Date('2027-05-31T23:59:59Z'),
      applicationsOpenAt: new Date(Date.now() - 5 * 24 * 3600000),
      applicationsCloseAt: new Date(Date.now() + 25 * 24 * 3600000),
      maxApplicationsPerMember: 2,
      status: 'OPEN',
      createdById: createdUsers['president@nirmauni.ac.in'].id,
    },
  });

  const postsData = [
    {
      id: '71000000-0000-0000-0000-000000000001',
      role: 'EVENT_HEAD',
      seats: 2,
      description: 'Lead event conceptualization, scheduling, venue permits, and production coordination.',
      minMembershipDays: 30,
      questions: [
        {
          id: '72000000-0000-0000-0000-000000000001',
          sortOrder: 1,
          label: 'Describe your vision and 2 flagship events you would host for the upcoming tenure.',
          type: 'TEXTAREA',
          required: true,
        },
        {
          id: '72000000-0000-0000-0000-000000000002',
          sortOrder: 2,
          label: 'Describe a crisis or delay you managed during a past campus activity.',
          type: 'TEXTAREA',
          required: true,
        },
      ],
    },
    {
      id: '71000000-0000-0000-0000-000000000002',
      role: 'TREASURER',
      seats: 1,
      description: 'Manage club financial books, budget allocations, reimbursement verifications, and audit reports.',
      minMembershipDays: 60,
      questions: [
        {
          id: '72000000-0000-0000-0000-000000000003',
          sortOrder: 1,
          label: 'What accounting or spreadsheet skills do you bring to maintain transparent finances?',
          type: 'TEXTAREA',
          required: true,
        },
      ],
    },
    {
      id: '71000000-0000-0000-0000-000000000003',
      role: 'VOLUNTEER_HEAD',
      seats: 1,
      description: 'Recruit, train, and manage volunteer duty rosters across all campus events and drives.',
      minMembershipDays: 15,
      questions: [
        {
          id: '72000000-0000-0000-0000-000000000004',
          sortOrder: 1,
          label: 'How will you keep 50+ student volunteers motivated and accountable throughout the year?',
          type: 'TEXTAREA',
          required: true,
        },
      ],
    },
  ];

  for (const pd of postsData) {
    const post = await prisma.selectionPost.upsert({
      where: { cycleId_role: { cycleId: cycle.id, role: pd.role } },
      update: { seats: pd.seats, description: pd.description, minMembershipDays: pd.minMembershipDays },
      create: {
        id: pd.id,
        cycleId: cycle.id,
        role: pd.role,
        seats: pd.seats,
        description: pd.description,
        minMembershipDays: pd.minMembershipDays,
      },
    });

    for (const q of pd.questions) {
      await prisma.selectionQuestion.upsert({
        where: { id: q.id },
        update: { label: q.label, type: q.type, required: q.required, sortOrder: q.sortOrder },
        create: {
          id: q.id,
          postId: post.id,
          label: q.label,
          type: q.type,
          required: q.required,
          sortOrder: q.sortOrder,
        },
      });
    }
  }

  // Seed sample application
  const eventPost = await prisma.selectionPost.findFirst({
    where: { cycleId: cycle.id, role: 'EVENT_HEAD' },
    include: { questions: true },
  });
  if (eventPost) {
    const existingApp = await prisma.application.findFirst({
      where: { postId: eventPost.id, applicantId: createdUsers['student1@nirmauni.ac.in'].id },
    });
    if (!existingApp) {
      await prisma.application.create({
        data: {
          postId: eventPost.id,
          applicantId: createdUsers['student1@nirmauni.ac.in'].id,
          status: 'SUBMITTED',
          answers: {
            create: eventPost.questions.map((q) => ({
              questionId: q.id,
              value: 'I plan to host a statewide Robotics Olympiad and an AI Career Summit with leading founders.',
            })),
          },
        },
      });
    }
  }
  console.log('✓ Seeded governance selection cycles, leadership posts, and sample application');

  // Helper for Meetings
  async function upsertMeeting({ id, title, startAt, endAt, location, audience, createdById, agendaItems, invites }) {
    const meeting = await prisma.meeting.upsert({
      where: { id },
      update: { title, startAt, endAt, location, audience, status: 'SCHEDULED' },
      create: { id, title, startAt, endAt, location, audience, status: 'SCHEDULED', createdById },
    });

    for (const a of agendaItems) {
      await prisma.agendaItem.upsert({
        where: { meetingId_sortOrder: { meetingId: meeting.id, sortOrder: a.sortOrder } },
        update: { topic: a.topic, durationMin: a.durationMin, ownerId: a.ownerId },
        create: {
          meetingId: meeting.id,
          sortOrder: a.sortOrder,
          topic: a.topic,
          durationMin: a.durationMin,
          ownerId: a.ownerId,
        },
      });
    }

    for (const inv of invites) {
      await prisma.meetingInvite.upsert({
        where: { meetingId_userId: { meetingId: meeting.id, userId: inv.userId } },
        update: { rsvp: inv.rsvp },
        create: {
          meetingId: meeting.id,
          userId: inv.userId,
          rsvp: inv.rsvp,
        },
      });
    }
    return meeting;
  }

  // 9. Meetings & Agendas
  await upsertMeeting({
    id: '80000000-0000-0000-0000-000000000001',
    title: 'Executive Council Bi-Weekly Planning & Budget Review',
    startAt: new Date(Date.now() + 3 * 24 * 3600000),
    endAt: new Date(Date.now() + 3 * 24 * 3600000 + 90 * 60000),
    location: 'Conference Room B, Admin Block',
    audience: 'LEADERS',
    createdById: createdUsers['president@nirmauni.ac.in'].id,
    agendaItems: [
      { sortOrder: 1, topic: 'Review of Q1 ledger entries & sponsorship updates', durationMin: 25, ownerId: createdUsers['treasurer@nirmauni.ac.in'].id },
      { sortOrder: 2, topic: 'Spring Gala ticket sales progress & VIP seating', durationMin: 25, ownerId: createdUsers['eventhead@nirmauni.ac.in'].id },
      { sortOrder: 3, topic: 'Bake sale volunteer rosters & cash collection desks', durationMin: 20, ownerId: createdUsers['volunteerhead@nirmauni.ac.in'].id },
    ],
    invites: [
      { userId: createdUsers['president@nirmauni.ac.in'].id, rsvp: 'YES' },
      { userId: createdUsers['treasurer@nirmauni.ac.in'].id, rsvp: 'YES' },
      { userId: createdUsers['eventhead@nirmauni.ac.in'].id, rsvp: 'YES' },
      { userId: createdUsers['volunteerhead@nirmauni.ac.in'].id, rsvp: 'PENDING' },
    ],
  });

  await upsertMeeting({
    id: '80000000-0000-0000-0000-000000000002',
    title: 'Spring Gala All-Hands Volunteer Briefing',
    startAt: new Date(Date.now() + 10 * 24 * 3600000),
    endAt: new Date(Date.now() + 10 * 24 * 3600000 + 60 * 60000),
    location: 'University Grand Auditorium',
    audience: 'BOTH',
    createdById: createdUsers['eventhead@nirmauni.ac.in'].id,
    agendaItems: [
      { sortOrder: 1, topic: 'Mobile ticket QR scanner app instructions', durationMin: 20, ownerId: createdUsers['door@nirmauni.ac.in'].id },
      { sortOrder: 2, topic: 'Stage transitions, artist coordination & green room management', durationMin: 20, ownerId: createdUsers['volunteer2@nirmauni.ac.in'].id },
      { sortOrder: 3, topic: 'Emergency evacuation & medical aid protocols', durationMin: 15, ownerId: createdUsers['eventhead@nirmauni.ac.in'].id },
    ],
    invites: [
      { userId: createdUsers['volunteer1@nirmauni.ac.in'].id, rsvp: 'YES' },
      { userId: createdUsers['volunteer2@nirmauni.ac.in'].id, rsvp: 'YES' },
      { userId: createdUsers['volunteer3@nirmauni.ac.in'].id, rsvp: 'YES' },
      { userId: createdUsers['door@nirmauni.ac.in'].id, rsvp: 'YES' },
      { userId: createdUsers['cashdesk@nirmauni.ac.in'].id, rsvp: 'PENDING' },
    ],
  });
  console.log('✓ Seeded meetings, agenda items, and meeting invites');

  // 10. Announcements
  await prisma.announcement.upsert({
    where: { id: '90000000-0000-0000-0000-000000000010' },
    update: {},
    create: {
      id: '90000000-0000-0000-0000-000000000010',
      title: 'Welcome to the New Skyline Organization Platform!',
      bodyMd: 'We are thrilled to launch the new centralized platform for LDCE & Nirma students. Access digital membership cards, discounted event tickets, official hoodies, and transparent student governance all in one place.',
      audience: 'PUBLIC',
      status: 'PUBLISHED',
      publishedAt: new Date(Date.now() - 10 * 24 * 3600000),
      authorId: createdUsers['president@nirmauni.ac.in'].id,
    },
  });

  await prisma.announcement.upsert({
    where: { id: '90000000-0000-0000-0000-000000000011' },
    update: {},
    create: {
      id: '90000000-0000-0000-0000-000000000011',
      title: 'Spring Gala 2026 Ticket Sales Now Live',
      bodyMd: 'Early bird tickets for the flagship Spring Gala 2026 are now open for verified members at 50% discount. Make sure to claim your tickets early before quotas fill up.',
      audience: 'MEMBERS',
      status: 'PUBLISHED',
      publishedAt: new Date(Date.now() - 5 * 24 * 3600000),
      authorId: createdUsers['eventhead@nirmauni.ac.in'].id,
    },
  });

  await prisma.announcement.upsert({
    where: { id: '90000000-0000-0000-0000-000000000012' },
    update: {},
    create: {
      id: '90000000-0000-0000-0000-000000000012',
      title: 'Call for Volunteers: CodeWave LDCE Hackathon 2026',
      bodyMd: 'Join the organizing committee as a volunteer for technical setup, hacker logistics, catering, and social coverage. Receive an official certificate of appreciation.',
      audience: 'PUBLIC',
      status: 'PUBLISHED',
      publishedAt: new Date(Date.now() - 2 * 24 * 3600000),
      authorId: createdUsers['volunteerhead@nirmauni.ac.in'].id,
    },
  });
  console.log('✓ Seeded official announcements');

  // 11. In-App Notifications
  const sampleNotifications = [
    {
      userId: createdUsers['student1@nirmauni.ac.in'].id,
      title: 'Spring Gala Ticket Confirmed',
      body: 'Your ticket for Spring Gala 2026 has been issued. Show your digital pass at the door scanner.',
      type: 'TICKETING',
      link: '/tickets/me',
      readAt: null,
    },
    {
      userId: createdUsers['volunteer1@nirmauni.ac.in'].id,
      title: 'New Volunteer Task Assigned',
      body: 'You were assigned to task: "Bake cookies and brownies" under Campus Bake Sale Fundraiser.',
      type: 'VOLUNTEER',
      link: '/volunteer',
      readAt: null,
    },
    {
      userId: createdUsers['treasurer@nirmauni.ac.in'].id,
      title: 'New Expense Claim Submitted',
      body: 'Ananya Joshi submitted an expense claim of ₹2,500 for Bake Sale packaging supplies.',
      type: 'FINANCE',
      link: '/manage/claims',
      readAt: null,
    },
    {
      userId: createdUsers['president@nirmauni.ac.in'].id,
      title: 'Executive Council Meeting Reminder',
      body: 'Bi-Weekly Planning & Budget Review meeting scheduled for Friday at 3:00 PM in Conference Room B.',
      type: 'GOVERNANCE',
      link: '/manage/meetings',
      readAt: new Date(),
    },
  ];
  for (const n of sampleNotifications) {
    const existing = await prisma.notification.findFirst({
      where: { userId: n.userId, title: n.title },
    });
    if (!existing) {
      await prisma.notification.create({ data: n });
    }
  }
  console.log('✓ Seeded in-app notifications');

  console.log('\n======================================================');
  console.log('🎉 Full database seeding completed successfully!');
  console.log('======================================================');
  console.log(`Demo login credentials (password: "${defaultPassword}"):`);
  console.log('  - Mentor / Faculty:     mentor@nirmauni.ac.in');
  console.log('  - President:            president@nirmauni.ac.in');
  console.log('  - Treasurer:            treasurer@nirmauni.ac.in');
  console.log('  - Event Head:           eventhead@nirmauni.ac.in');
  console.log('  - Volunteer Head:       volunteerhead@nirmauni.ac.in');
  console.log('  - Marketing Head:       marketinghead@nirmauni.ac.in');
  console.log('  - Door Scanner:         door@nirmauni.ac.in');
  console.log('  - Cash Desk:            cashdesk@nirmauni.ac.in');
  console.log('  - Active Volunteer:     volunteer1@nirmauni.ac.in');
  console.log('  - Verified Member:      student1@nirmauni.ac.in');
  console.log('  - Student / User:       student4@nirmauni.ac.in');
  console.log('======================================================\n');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
