import { PrismaClient } from '@prisma/client';
import crypto from 'node:crypto';

// N days from today at a fixed IST wall-clock time, so seeded events start at sensible hours.
const atIST = (days, hour, minute = 0) => {
  const d = new Date(Date.now() + days * 24 * 3600000);
  const ymd = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  return new Date(`${ymd}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+05:30`);
};
import { hashPassword } from '../src/utils/security.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Skyline Student Association database with full realistic data...');

  const defaultPassword = process.env.SEED_PASSWORD || 'Password123!';
  const passwordHash = await hashPassword(defaultPassword);

  // Reset existing data to ensure pristine state and valid UUID foreign keys
  console.log('Resetting existing database records...');
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE 
      users, refresh_tokens, email_tokens, role_assignments, membership_tiers, memberships,
      cash_collections, events, event_budget_lines, event_reviews, ticket_types, ticket_reservations, tickets,
      ledger_entries, budget_allocations, budget_limits, expense_claims, claim_receipts, claim_decisions,
      selection_cycles, selection_posts, selection_questions, applications, application_answers, appointments,
      settings, audit_logs, idempotency_keys, payments, files, email_outbox, notifications, approvals,
      products, product_images, variants, stock_adjustments, orders, order_items, announcements, announcement_corrections,
      newsletter_subscribers, newsletter_consents, newsletter_campaigns, volunteers, projects, tasks, task_assignees
    CASCADE;
  `);
  console.log('✓ Database tables cleared');

  // ==========================================
  // 1. Club Settings
  // ==========================================
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

  // ==========================================
  // 2. Membership Tiers
  // ==========================================
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

  // ==========================================
  // 3. Users & Core Accounts
  // ==========================================
  const userDefs = [
    { id: '10000000-0000-4000-8000-000000000001', email: 'mentor@nirmauni.ac.in', name: 'Dr. Mentor Sharma', studentId: 'FACULTY-001', role: 'MENTOR' },
    { id: '10000000-0000-4000-8000-000000000002', email: 'president@nirmauni.ac.in', name: 'Aarav Patel', studentId: '22BCE101', role: 'PRESIDENT', isMember: true },
    { id: '10000000-0000-4000-8000-000000000003', email: 'treasurer@nirmauni.ac.in', name: 'Diya Shah', studentId: '22BCE102', role: 'TREASURER', isMember: true },
    { id: '10000000-0000-4000-8000-000000000004', email: 'eventhead@nirmauni.ac.in', name: 'Rohan Mehta', studentId: '22BCE103', role: 'EVENT_HEAD', isMember: true },
    { id: '10000000-0000-4000-8000-000000000005', email: 'volunteerhead@nirmauni.ac.in', name: 'Sanya Kapoor', studentId: '22BCE104', role: 'VOLUNTEER_HEAD', isMember: true },
    { id: '10000000-0000-4000-8000-000000000006', email: 'marketinghead@nirmauni.ac.in', name: 'Vikram Rathore', studentId: '22BCE105', role: 'MARKETING_HEAD', isMember: true },
    { id: '10000000-0000-4000-8000-000000000019', email: 'sponsorship@nirmauni.ac.in', name: 'Ishita Desai', studentId: '22BCE106', role: 'SPONSORSHIP_HEAD', isMember: true },
    { id: '10000000-0000-4000-8000-000000000007', email: 'door@nirmauni.ac.in', name: 'Karan Singhania', studentId: '23BCE150', isVolunteer: true, isMember: true },
    { id: '10000000-0000-4000-8000-000000000008', email: 'cashdesk@nirmauni.ac.in', name: 'Neha Desai', studentId: '23BCE160', isVolunteer: true, isMember: true },
    { id: '10000000-0000-4000-8000-000000000009', email: 'volunteer1@nirmauni.ac.in', name: 'Ananya Joshi', studentId: '23BCE201', isVolunteer: true, isMember: true },
    { id: '10000000-0000-4000-8000-000000000010', email: 'volunteer2@nirmauni.ac.in', name: 'Kabir Verma', studentId: '23BCE202', isVolunteer: true },
    { id: '10000000-0000-4000-8000-000000000011', email: 'volunteer3@nirmauni.ac.in', name: 'Rhea Sen', studentId: '23BCE203', isVolunteer: true },
    { id: '10000000-0000-4000-8000-000000000012', email: 'student1@nirmauni.ac.in', name: 'Pooja Trivedi', studentId: '23BCE301', isMember: true },
    { id: '10000000-0000-4000-8000-000000000013', email: 'student2@nirmauni.ac.in', name: 'Harsh Dave', studentId: '23BCE302', isMember: true, isSemesterMember: true },
    { id: '10000000-0000-4000-8000-000000000014', email: 'student3@nirmauni.ac.in', name: 'Meera Nair', studentId: '23BCE303', isMember: true, expiresInDays: 14 },
    { id: '10000000-0000-4000-8000-000000000015', email: 'student4@nirmauni.ac.in', name: 'Devansh Bhatt', studentId: '24BCE401' },
    { id: '10000000-0000-4000-8000-000000000016', email: 'student5@nirmauni.ac.in', name: 'Tanvi Joshi', studentId: '24BCE402', pendingMember: true },
    { id: '10000000-0000-4000-8000-000000000017', email: 'student6@nirmauni.ac.in', name: 'Aditya Shah', studentId: '23BCE310', isMember: true },
    { id: '10000000-0000-4000-8000-000000000018', email: 'faculty2@nirmauni.ac.in', name: 'Prof. Hasmukh Patel', studentId: 'FACULTY-002', role: 'MENTOR' },
  ];

  const createdUsers = {};
  for (const def of userDefs) {
    const user = await prisma.user.upsert({
      where: { email: def.email },
      update: { name: def.name, studentId: def.studentId },
      create: {
        id: def.id,
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
        const payment = await prisma.payment.create({
          data: {
            userId: user.id,
            purpose: 'MEMBERSHIP',
            refId: user.id,
            amountPaise: (def.isSemesterMember ? semesterTier : annualTier).pricePaise,
            status: 'PAID',
            provider: 'MOCK',
            gatewayOrderId: `order_mock_${crypto.randomUUID()}`,
            gatewayPaymentId: `pay_mock_${crypto.randomUUID().slice(0, 14)}`,
            paidAt: new Date(),
          },
        });

        await prisma.membership.create({
          data: {
            userId: user.id,
            tierId: def.isSemesterMember ? semesterTier.id : annualTier.id,
            status: 'ACTIVE',
            source: 'ONLINE',
            paymentId: payment.id,
            startsAt: new Date(),
            // expiresInDays: a membership due for renewal, so the Treasurer's reminder has someone to remind.
            expiresAt: new Date(Date.now() + (def.expiresInDays ?? (def.isSemesterMember ? 180 : 365)) * 24 * 3600000),
          },
        });
      }
    }

    // Signed up but dues not paid yet (shows under pending dues).
    if (def.pendingMember && !(await prisma.membership.findFirst({ where: { userId: user.id } }))) {
      await prisma.membership.create({ data: { userId: user.id, tierId: annualTier.id, status: 'PENDING', source: 'ONLINE' } });
    }
  }
  console.log('✓ Seeded users, roles, memberships, and volunteers');

  // ==========================================
  // 6. Merchandise Products, Variants, and Orders
  // ==========================================
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

  const hoodie = await upsertProduct({
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Skyline Club Signature Hoodie',
    description: 'Heavyweight premium navy blue fleece hoodie featuring the golden embroidered Skyline crest on the chest and custom sleeve branding.',
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
    description: '100% combed cotton jersey t-shirt with matte black typographic skyline print and breathable campus wear fit.',
    category: 'APPAREL',
    memberPricePaise: BigInt(39900), // ₹399
    nonMemberPricePaise: BigInt(59900), // ₹599
    variants: [
      { id: '41000000-0000-0000-0000-000000000010', sku: 'TS-BLK-S', size: 'S', color: 'Matte Black', stock: 30, reserved: 0 },
      { id: '41000000-0000-0000-0000-000000000011', sku: 'TS-BLK-M', size: 'M', color: 'Matte Black', stock: 60, reserved: 2 },
      { id: '41000000-0000-0000-0000-000000000012', sku: 'TS-BLK-L', size: 'L', color: 'Matte Black', stock: 50, reserved: 1 },
      { id: '41000000-0000-0000-0000-000000000013', sku: 'TS-GRY-M', size: 'M', color: 'Heather Grey', stock: 40, reserved: 0 },
    ],
  });

  const flask = await upsertProduct({
    id: '40000000-0000-0000-0000-000000000003',
    name: 'Insulated Stainless Steel Flask (750ml)',
    description: 'Double-walled vacuum insulated water bottle keeping drinks hot for 12h or cold for 24h. Laser-etched Skyline seal.',
    category: 'ACCESSORIES',
    memberPricePaise: BigInt(45000), // ₹450
    nonMemberPricePaise: BigInt(65000), // ₹650
    variants: [
      { id: '41000000-0000-0000-0000-000000000020', sku: 'FLASK-SLV', size: '750ml', color: 'Brushed Silver', stock: 40, reserved: 0 },
      { id: '41000000-0000-0000-0000-000000000021', sku: 'FLASK-BLK', size: '750ml', color: 'Matte Midnight', stock: 35, reserved: 1 },
    ],
  });

  const cap = await upsertProduct({
    id: '40000000-0000-0000-0000-000000000004',
    name: 'Official Skyline Embroidered Cap',
    description: 'Six-panel premium structured baseball cap with brass buckle strap and high-density 3D logo embroidery.',
    category: 'ACCESSORIES',
    memberPricePaise: BigInt(29900), // ₹299
    nonMemberPricePaise: BigInt(44900), // ₹449
    variants: [
      { id: '41000000-0000-0000-0000-000000000030', sku: 'CAP-CRIMSON', size: 'Adjustable', color: 'Crimson Red', stock: 50, reserved: 1 },
      { id: '41000000-0000-0000-0000-000000000031', sku: 'CAP-CHARCOAL', size: 'Adjustable', color: 'Charcoal Grey', stock: 45, reserved: 0 },
    ],
  });

  const stickers = await upsertProduct({
    id: '40000000-0000-0000-0000-000000000005',
    name: 'Campus Laptop Stickers Pack (10 Vinyl Decals)',
    description: 'Weatherproof matte finish die-cut vinyl stickers for laptops, notebooks, and tablets featuring iconic LDCE and tech graphics.',
    category: 'ACCESSORIES',
    memberPricePaise: BigInt(9900), // ₹99
    nonMemberPricePaise: BigInt(14900), // ₹149
    variants: [
      { id: '41000000-0000-0000-0000-000000000040', sku: 'STICKER-PACK-10', size: 'One Size', color: 'Multicolor Pack', stock: 120, reserved: 1 },
    ],
  });
  console.log('\n================================================================');
  console.log('🎉 Full database seeding completed successfully!');
  console.log('Every platform feature now has rich, realistic data for testing:');
  console.log('================================================================');
  console.log(`Demo login credentials (password: "${defaultPassword}"):`);
  console.log('  - Mentor / Faculty:     mentor@nirmauni.ac.in        (Can review events at /manage)');
  console.log('  - President:            president@nirmauni.ac.in     (Full council & project access)');
  console.log('  - Treasurer:            treasurer@nirmauni.ac.in     (Ledger, budget, claims, cash verification)');
  console.log('  - Event Head:           eventhead@nirmauni.ac.in     (Create & manage event proposals)');
  console.log('  - Volunteer Head:       volunteerhead@nirmauni.ac.in (Manage rosters and duties)');
  console.log('  - Marketing Head:       marketinghead@nirmauni.ac.in (Campaigns and drops)');
  console.log('  - Sponsorship Head:     sponsorship@nirmauni.ac.in  (Odoo CRM sponsorship pipeline)');
  console.log('  - Door Scanner:         door@nirmauni.ac.in          (Test QR check-in at /door/00000000-0000-0000-0000-000000000001)');
  console.log('  - Cash Desk:            cashdesk@nirmauni.ac.in      (Record cash collections at /cash-desk)');
  console.log('  - Active Volunteer:     volunteer1@nirmauni.ac.in    (Active tasks & claims at /volunteer)');
  console.log('  - Verified Member:      student1@nirmauni.ac.in      (Tickets at /me/tickets, orders at /me/orders)');
  console.log('  - Member with Ready:    student2@nirmauni.ac.in      (Ready orders & checked-in tickets)');
  console.log('  - Non-Member Student:   student4@nirmauni.ac.in      (Join membership, browse events & shop)');
  console.log('================================================================\n');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
