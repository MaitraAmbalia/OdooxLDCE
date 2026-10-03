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
  // 4. Events, Ticket Types, Budget Lines, Reviews
  // ==========================================
  async function upsertEvent({ 
    id, title, description, category, venue, startAt, endAt, capacity, visibility, 
    status = 'PUBLISHED', proposedById, approvedById, approvedAt, approvedBudgetPaise, 
    sponsorshipRequired = false,
    sponsorshipTargetPaise = null,
    sponsorshipDeadline = null,
    sponsorshipPitch = null,
    sponsorshipPackages = [],
    sponsorBenefits = null,
    ticketTypes = [], budgetLines = [] 
  }) {
    const event = await prisma.event.upsert({
      where: { id },
      update: { 
        title, description, category, venue, startAt, endAt, capacity, visibility, status, 
        approvedById, approvedAt, approvedBudgetPaise,
        sponsorshipRequired,
        sponsorshipTargetPaise,
        sponsorshipDeadline,
        sponsorshipPitch,
        sponsorshipPackages,
        sponsorBenefits,
      },
      create: { 
        id, title, description, category, venue, startAt, endAt, capacity, seatsSold: 0, visibility, status, 
        proposedById, approvedById, approvedAt, approvedBudgetPaise,
        sponsorshipRequired,
        sponsorshipTargetPaise,
        sponsorshipDeadline,
        sponsorshipPitch,
        sponsorshipPackages,
        sponsorBenefits,
      },
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
          // Past events: open sales 30 days before they ended so start < end (DB check constraint).
          salesStartAt: tt.salesStartAt ?? new Date(Math.min(Date.now(), event.endAt.getTime() - 30 * 24 * 3600000)),
          salesEndAt: tt.salesEndAt ?? event.endAt,
        },
      });
    }

    for (const bl of budgetLines) {
      await prisma.eventBudgetLine.upsert({
        where: { id: bl.id },
        update: { category: bl.category, amountPaise: bl.amountPaise, note: bl.note },
        create: {
          id: bl.id,
          eventId: event.id,
          category: bl.category,
          amountPaise: bl.amountPaise,
          note: bl.note,
        },
      });
    }

    return event;
  }

  // 4.1 Flagship Published Event: Spring Gala 2026
  const gala = await upsertEvent({
    id: '00000000-0000-0000-0000-000000000001',
    title: 'Spring Gala 2026',
    description: 'The premier flagship cultural evening and networking celebration of LDCE & Nirma University featuring student bands, formal dinner, and guest addresses.',
    category: 'GALA',
    venue: 'University Grand Auditorium',
    startAt: atIST(14, 18),
    endAt: new Date(atIST(14, 18).getTime() + 4 * 3600000),
    capacity: 350,
    visibility: 'PUBLIC',
    status: 'PUBLISHED',
    proposedById: createdUsers['eventhead@nirmauni.ac.in'].id,
    approvedById: createdUsers['mentor@nirmauni.ac.in'].id,
    approvedAt: new Date(Date.now() - 5 * 24 * 3600000),
    approvedBudgetPaise: BigInt(8500000), // ₹85,000
    sponsorshipRequired: true,
    sponsorshipTargetPaise: BigInt(15000000), // ₹1,50,000
    sponsorshipDeadline: new Date(Date.now() + 10 * 24 * 3600000),
    sponsorshipPitch: 'Sponsor the premier flagship cultural evening and networking celebration of LDCE & Nirma University featuring student bands, formal dinner, and guest addresses with 350+ attendees.',
    sponsorshipPackages: ['Title Sponsor', 'Gold Sponsor', 'Silver Sponsor', 'Food Partner'],
    sponsorBenefits: 'Main stage banner branding, 5-minute executive pitch slot, logo on all 350+ entry passes, and dedicated booth in student lobby.',
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

  // 4.2 Published Hackathon: CodeWave LDCE 2026
  const hackathon = await upsertEvent({
    id: '30000000-0000-0000-0000-000000000002',
    title: 'CodeWave LDCE Hackathon 2026',
    description: '36-hour student hackathon building open solutions in AI, campus mobility, and fintech. Over 1.5 Lakhs in cash prizes, mentors, free food, and exclusive sponsor swags.',
    category: 'HACKATHON',
    venue: 'Computer Engineering Department Labs',
    startAt: atIST(28, 9),
    endAt: atIST(30, 9),
    capacity: 200,
    visibility: 'PUBLIC',
    status: 'PUBLISHED',
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

  // 4.3 Published Workshop: Leadership Strategy
  const workshop = await upsertEvent({
    id: '30000000-0000-0000-0000-000000000003',
    title: 'Leadership & Venture Strategy Workshop',
    description: 'Hands-on session with industry founders on organizational scaling, student venture ideation, and financial budgeting.',
    category: 'WORKSHOP',
    venue: 'Seminar Hall 3, Management Block',
    startAt: atIST(7, 10),
    endAt: new Date(atIST(7, 10).getTime() + 3 * 3600000),
    capacity: 100,
    visibility: 'PUBLIC',
    status: 'PUBLISHED',
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

  // 4.4 Event Pending Mentor Review: RoboWars & Drone Grand Prix (TESTING MENTOR REVIEW)
  const roboWars = await upsertEvent({
    id: '30000000-0000-0000-0000-000000000004',
    title: 'RoboWars & Drone Grand Prix 2026',
    description: 'Flagship inter-college combat robotics tournament and autonomous FPV drone obstacle racing league in the campus open arena.',
    category: 'COMPETITION',
    venue: 'Campus Open Air Amphitheatre',
    startAt: atIST(21, 9),
    endAt: atIST(22, 9),
    capacity: 400,
    visibility: 'PUBLIC',
    status: 'PENDING_APPROVAL', // Ready for Dr. Mentor Sharma to review at /manage/events/:id/review
    proposedById: createdUsers['eventhead@nirmauni.ac.in'].id,
    ticketTypes: [
      {
        id: '31000000-0000-0000-0000-000000000030',
        name: 'Spectator Stadium Pass',
        audience: 'ALL',
        pricePaise: BigInt(10000), // ₹100
        quota: 300,
        maxPerUser: 3,
      },
      {
        id: '31000000-0000-0000-0000-000000000031',
        name: 'Combat Robot Team Registration',
        audience: 'ALL',
        pricePaise: BigInt(150000), // ₹1,500
        quota: 30,
        maxPerUser: 1,
      },
    ],
    budgetLines: [
      {
        id: '33000000-0000-0000-0000-000000000001',
        category: 'Arena Safety & Polycarbonate Shielding',
        amountPaise: BigInt(2500000), // ₹25,000
        note: 'High-impact bulletproof polycarbonate sheet enclosure for combat arena',
      },
      {
        id: '33000000-0000-0000-0000-000000000002',
        category: 'Trophies and Prize Pool',
        amountPaise: BigInt(4500000), // ₹45,000
        note: 'Cash prizes for 1st, 2nd, and 3rd place combat bots and drone racing winner',
      },
      {
        id: '33000000-0000-0000-0000-000000000003',
        category: 'Livestreaming and FPV Monitors',
        amountPaise: BigInt(1200000), // ₹12,000
        note: 'Low-latency RF receiver screens and HDMI video mixing desk',
      },
    ],
  });

  // 4.5 Event with Mentor Changes Requested: Campus Film Showcase
  const filmShowcase = await upsertEvent({
    id: '30000000-0000-0000-0000-000000000005',
    title: 'Campus Film & Photography Showcase',
    description: 'Screening of top student short films, documentary shorts, and photo gallery exhibition in the central library lobby.',
    category: 'EXHIBITION',
    venue: 'Central Library Exhibition Hall',
    startAt: atIST(35, 17),
    endAt: new Date(atIST(35, 17).getTime() + 5 * 3600000),
    capacity: 150,
    visibility: 'PUBLIC',
    status: 'CHANGES_REQUESTED',
    proposedById: createdUsers['marketinghead@nirmauni.ac.in'].id,
    ticketTypes: [
      {
        id: '31000000-0000-0000-0000-000000000040',
        name: 'Film Showcase Free Pass',
        audience: 'ALL',
        pricePaise: BigInt(0),
        quota: 150,
        maxPerUser: 2,
      },
    ],
  });

  // Seed EventReview note for the film showcase
  await prisma.eventReview.upsert({
    where: { id: '34000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '34000000-0000-0000-0000-000000000001',
      eventId: filmShowcase.id,
      reviewerId: createdUsers['mentor@nirmauni.ac.in'].id,
      decision: 'REQUEST_CHANGES',
      comment: 'Please coordinate with the Library Chief Warden regarding projector electrical loads and specify fire extinguisher placements near the projection booth.',
      snapshot: { proposedCapacity: 150, requestedBudget: 15000 },
    },
  });

  // 4.6 Past Event: Alumni Tech Conclave 2025 (CLOSED)
  const pastConclave = await upsertEvent({
    id: '30000000-0000-0000-0000-000000000006',
    title: 'Annual Alumni Tech Conclave 2025',
    description: 'Keynote panels with distinguished alumni working at Google, Microsoft, and premier tech startups.',
    category: 'CONFERENCE',
    venue: 'Main Auditorium',
    startAt: atIST(-60, 10),
    endAt: new Date(atIST(-60, 10).getTime() + 6 * 3600000),
    capacity: 300,
    visibility: 'PUBLIC',
    status: 'CLOSED',
    proposedById: createdUsers['eventhead@nirmauni.ac.in'].id,
    approvedById: createdUsers['mentor@nirmauni.ac.in'].id,
    approvedAt: new Date(Date.now() - 75 * 24 * 3600000),
    ticketTypes: [
      {
        id: '31000000-0000-0000-0000-000000000050',
        name: 'Delegate Pass',
        audience: 'ALL',
        pricePaise: BigInt(20000),
        quota: 300,
        maxPerUser: 1,
      },
    ],
  });

  // ==========================================
  // 5. Issued Tickets (Testing Door Scanner & My Tickets)
  // ==========================================
  const galaTicketType = await prisma.ticketType.findFirst({ where: { eventId: gala.id, audience: 'MEMBER' } });
  const galaGeneralType = await prisma.ticketType.findFirst({ where: { eventId: gala.id, audience: 'NON_MEMBER' } });
  const hackathonTicketType = await prisma.ticketType.findFirst({ where: { eventId: hackathon.id } });
  const workshopTicketType = await prisma.ticketType.findFirst({ where: { eventId: workshop.id } });

  const ticketsToSeed = [
    // Ticket 1: student1 Gala (Active, ready for check-in)
    {
      id: '32000000-0000-0000-0000-000000000001',
      eventId: gala.id,
      ticketTypeId: galaTicketType.id,
      userId: createdUsers['student1@nirmauni.ac.in'].id,
      pricePaidPaise: galaTicketType.pricePaise,
      status: 'ISSUED',
    },
    // Ticket 2: student2 Gala (Already checked in -> test ALREADY_CHECKED_IN warn in scanner)
    {
      id: '32000000-0000-0000-0000-000000000002',
      eventId: gala.id,
      ticketTypeId: galaTicketType.id,
      userId: createdUsers['student2@nirmauni.ac.in'].id,
      pricePaidPaise: galaTicketType.pricePaise,
      status: 'CHECKED_IN',
      checkedInAt: new Date(),
      checkedInById: createdUsers['door@nirmauni.ac.in'].id,
    },
    // Ticket 3: student3 Gala General Admission
    {
      id: '32000000-0000-0000-0000-000000000003',
      eventId: gala.id,
      ticketTypeId: galaGeneralType.id,
      userId: createdUsers['student3@nirmauni.ac.in'].id,
      pricePaidPaise: galaGeneralType.pricePaise,
      status: 'ISSUED',
    },
    // Ticket 4: student6 Gala Early Bird
    {
      id: '32000000-0000-0000-0000-000000000004',
      eventId: gala.id,
      ticketTypeId: galaTicketType.id,
      userId: createdUsers['student6@nirmauni.ac.in'].id,
      pricePaidPaise: galaTicketType.pricePaise,
      status: 'ISSUED',
    },
    // Ticket 5: student1 Hackathon Hacker Pass
    {
      id: '32000000-0000-0000-0000-000000000005',
      eventId: hackathon.id,
      ticketTypeId: hackathonTicketType.id,
      userId: createdUsers['student1@nirmauni.ac.in'].id,
      pricePaidPaise: BigInt(0),
      status: 'ISSUED',
    },
    // Ticket 6: student4 Hackathon Hacker Pass
    {
      id: '32000000-0000-0000-0000-000000000006',
      eventId: hackathon.id,
      ticketTypeId: hackathonTicketType.id,
      userId: createdUsers['student4@nirmauni.ac.in'].id,
      pricePaidPaise: BigInt(0),
      status: 'ISSUED',
    },
    // Ticket 7: volunteer1 Hackathon Hacker Pass (Checked In)
    {
      id: '32000000-0000-0000-0000-000000000007',
      eventId: hackathon.id,
      ticketTypeId: hackathonTicketType.id,
      userId: createdUsers['volunteer1@nirmauni.ac.in'].id,
      pricePaidPaise: BigInt(0),
      status: 'CHECKED_IN',
      checkedInAt: new Date(),
      checkedInById: createdUsers['door@nirmauni.ac.in'].id,
    },
    // Ticket 8: student2 Workshop Pass
    {
      id: '32000000-0000-0000-0000-000000000008',
      eventId: workshop.id,
      ticketTypeId: workshopTicketType.id,
      userId: createdUsers['student2@nirmauni.ac.in'].id,
      pricePaidPaise: workshopTicketType.pricePaise,
      status: 'ISSUED',
    },
    // Ticket 9: student3 Workshop Pass (Cancelled)
    {
      id: '32000000-0000-0000-0000-000000000009',
      eventId: workshop.id,
      ticketTypeId: workshopTicketType.id,
      userId: createdUsers['student3@nirmauni.ac.in'].id,
      pricePaidPaise: workshopTicketType.pricePaise,
      status: 'CANCELLED',
    },
  ];

  for (const t of ticketsToSeed) {
    await prisma.ticket.upsert({
      where: { id: t.id },
      update: { status: t.status, checkedInAt: t.checkedInAt, checkedInById: t.checkedInById },
      create: t,
    });
  }
  // Keep the sold counters in step with the seeded tickets (the door scanner and reports read them).
  await prisma.$executeRaw`UPDATE ticket_types tt SET sold = (SELECT COUNT(*) FROM tickets t WHERE t.ticket_type_id = tt.id AND t.status IN ('ISSUED', 'CHECKED_IN'))`;
  await prisma.$executeRaw`UPDATE events e SET seats_sold = (SELECT COUNT(*) FROM tickets t WHERE t.event_id = e.id AND t.status IN ('ISSUED', 'CHECKED_IN'))`;
  console.log('✓ Seeded events, reviews, and 9 realistic tickets across users and statuses');

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

  // Seed sample orders across all FulfilmentQueue statuses: PAID (to pack), READY (ready for pickup), COLLECTED (collected)
  const hoodieVariantM = await prisma.variant.findFirst({ where: { sku: 'HD-NAVY-M' } });
  const teeVariantL = await prisma.variant.findFirst({ where: { sku: 'TS-BLK-L' } });
  const flaskVariantSlv = await prisma.variant.findFirst({ where: { sku: 'FLASK-SLV' } });
  const capVariantCrimson = await prisma.variant.findFirst({ where: { sku: 'CAP-CRIMSON' } });
  const stickerVariant = await prisma.variant.findFirst({ where: { sku: 'STICKER-PACK-10' } });

  const ordersToSeed = [
    // Order 1: student1 -> PAID (Appears in "To pack" tab in /manage/orders)
    {
      id: '42000000-0000-0000-0000-000000000001',
      userId: createdUsers['student1@nirmauni.ac.in'].id,
      status: 'PAID',
      totalPaise: BigInt(89900),
      items: [{ variantId: hoodieVariantM.id, quantity: 1, unitPricePaise: BigInt(89900) }],
    },
    // Order 2: student2 -> READY (Appears in "Ready for pickup" tab in /manage/orders)
    {
      id: '42000000-0000-0000-0000-000000000002',
      userId: createdUsers['student2@nirmauni.ac.in'].id,
      status: 'READY',
      totalPaise: BigInt(39900),
      items: [{ variantId: teeVariantL.id, quantity: 1, unitPricePaise: BigInt(39900) }],
    },
    // Order 3: student3 -> COLLECTED (Appears in "Collected" tab in /manage/orders)
    {
      id: '42000000-0000-0000-0000-000000000003',
      userId: createdUsers['student3@nirmauni.ac.in'].id,
      status: 'COLLECTED',
      totalPaise: BigInt(45000),
      collectedAt: new Date(Date.now() - 2 * 24 * 3600000),
      collectedById: createdUsers['cashdesk@nirmauni.ac.in'].id,
      items: [{ variantId: flaskVariantSlv.id, quantity: 1, unitPricePaise: BigInt(45000) }],
    },
    // Order 4: student4 -> PAID (Flask + Stickers)
    {
      id: '42000000-0000-0000-0000-000000000004',
      userId: createdUsers['student4@nirmauni.ac.in'].id,
      status: 'PAID',
      totalPaise: BigInt(79900),
      items: [
        { variantId: flaskVariantSlv.id, quantity: 1, unitPricePaise: BigInt(65000) },
        { variantId: stickerVariant.id, quantity: 1, unitPricePaise: BigInt(14900) },
      ],
    },
    // Order 5: student6 -> READY (Cap)
    {
      id: '42000000-0000-0000-0000-000000000005',
      userId: createdUsers['student6@nirmauni.ac.in'].id,
      status: 'READY',
      totalPaise: BigInt(29900),
      items: [{ variantId: capVariantCrimson.id, quantity: 1, unitPricePaise: BigInt(29900) }],
    },
  ];

  for (const o of ordersToSeed) {
    const existing = await prisma.order.findUnique({ where: { id: o.id } });
    if (!existing) {
      await prisma.order.create({
        data: {
          id: o.id,
          userId: o.userId,
          status: o.status,
          totalPaise: o.totalPaise,
          collectedAt: o.collectedAt,
          collectedById: o.collectedById,
          items: {
            create: o.items,
          },
        },
      });
    }
  }
  console.log('✓ Seeded merchandise products, variants, and orders across all fulfilment stages');

  // ==========================================
  // 7. Projects & Tasks (Kanban board & Volunteer duties)
  // ==========================================
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

  // 7.1 Project 1: Bake Sale
  const bakeSale = await upsertProject({
    id: '00000000-0000-0000-0000-000000000003',
    name: 'Campus Bake Sale Fundraiser',
    description: 'Raise funds for the club by selling homemade pastries, cookies, and iced teas on campus plaza.',
    type: 'FUNDRAISER',
    ownerId: createdUsers['president@nirmauni.ac.in'].id,
    tasks: [
      {
        id: '51000000-0000-0000-0000-000000000001',
        title: 'Bake cookies, brownies, and cupcakes',
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
        title: 'Buy packaging boxes, napkins, and ribbons',
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
      {
        id: '51000000-0000-0000-0000-000000000004',
        title: 'Design promotional posters and Instagram story flyers',
        description: 'Create high-contrast social flyers announcing dates and product menu.',
        priority: 'MEDIUM',
        status: 'DONE',
        dueDate: new Date(Date.now() - 1 * 24 * 3600000),
        createdById: createdUsers['marketinghead@nirmauni.ac.in'].id,
        assigneeUserIds: [createdUsers['marketinghead@nirmauni.ac.in'].id],
      },
    ],
  });

  // 7.2 Project 2: Spring Gala Logistics
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
      {
        id: '51000000-0000-0000-0000-000000000012',
        title: 'VIP seating arrangement & name place-cards',
        description: 'Design front row reserved seating chart for faculty deans and keynote speakers.',
        priority: 'MEDIUM',
        status: 'BLOCKED',
        dueDate: new Date(Date.now() + 10 * 24 * 3600000),
        createdById: createdUsers['eventhead@nirmauni.ac.in'].id,
        assigneeUserIds: [createdUsers['volunteer1@nirmauni.ac.in'].id],
      },
      {
        id: '51000000-0000-0000-0000-000000000013',
        title: 'Grand auditorium booking permits from Estate Office',
        description: 'Submit formal event proposal and Dean approval letter to campus security and estate department.',
        priority: 'HIGH',
        status: 'DONE',
        dueDate: new Date(Date.now() - 5 * 24 * 3600000),
        createdById: createdUsers['eventhead@nirmauni.ac.in'].id,
        assigneeUserIds: [createdUsers['eventhead@nirmauni.ac.in'].id],
      },
    ],
  });

  // 7.3 Project 3: Hackathon Lab & Network Setup
  const hackathonProject = await upsertProject({
    id: '50000000-0000-0000-0000-000000000003',
    name: 'CodeWave Lab Prep & Network Infrastructure',
    description: 'Ensure gigabit switches, dedicated Wi-Fi APs, and power extension strips are deployed for 200 developers.',
    type: 'EVENT_PREP',
    eventId: hackathon.id,
    ownerId: createdUsers['eventhead@nirmauni.ac.in'].id,
    tasks: [
      {
        id: '51000000-0000-0000-0000-000000000020',
        title: 'Configure high-density Wi-Fi SSID with IT Center',
        description: 'Test captive portal and bypass MAC filtering for participant laptops in Lab 3 & 4.',
        priority: 'HIGH',
        status: 'TODO',
        dueDate: new Date(Date.now() + 20 * 24 * 3600000),
        createdById: createdUsers['eventhead@nirmauni.ac.in'].id,
        assigneeUserIds: [createdUsers['volunteer3@nirmauni.ac.in'].id],
      },
      {
        id: '51000000-0000-0000-0000-000000000021',
        title: 'Procure 25 heavy-duty surge protected power strips',
        description: 'Ensure each team workbench has 6 available sockets for laptops and development boards.',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        dueDate: new Date(Date.now() + 18 * 24 * 3600000),
        createdById: createdUsers['eventhead@nirmauni.ac.in'].id,
        assigneeUserIds: [createdUsers['volunteer2@nirmauni.ac.in'].id],
      },
    ],
  });
  console.log('✓ Seeded projects, tasks across TODO, IN_PROGRESS, BLOCKED, and DONE columns');

  // ==========================================
  // 8. Finance: Budget Limits, Allocations, Multi-Month Ledger, Cash Collections, Claims
  // ==========================================
  // Spending caps only (income categories have no limit). Period format is YYYY-ODD|EVEN (lib/period.js).
  const BUDGET_PERIOD = '2026-ODD';
  await prisma.budgetLimit.deleteMany({ where: { period: 'AY2025-26' } });
  const budgetLimits = [
    { category: 'REIMBURSEMENT', limitPaise: BigInt(10000000) }, // ₹1,00,000
    { category: 'PURCHASE', limitPaise: BigInt(25000000) }, // ₹2,50,000
    { category: 'OTHER', limitPaise: BigInt(2500000) }, // ₹25,000
  ];
  for (const bl of budgetLimits) {
    await prisma.budgetLimit.upsert({
      where: { period_category: { period: BUDGET_PERIOD, category: bl.category } },
      update: { limitPaise: bl.limitPaise },
      create: {
        period: BUDGET_PERIOD,
        category: bl.category,
        limitPaise: bl.limitPaise,
      },
    });
  }

  await prisma.budgetAllocation.deleteMany({}); // re-seed without piling up grants
  const allocation = await prisma.budgetAllocation.create({
    data: {
      period: BUDGET_PERIOD,
      amountPaise: BigInt(30000000), // ₹3,00,000
      source: 'UNIVERSITY_GRANT',
      note: 'Annual University Grant for student club activities and operations',
      allocatedById: createdUsers['mentor@nirmauni.ac.in'].id,
    },
  });

  // Seed multi-month ledger entries for realistic financial reports and trend charts
  await prisma.ledgerEntry.deleteMany({});
  await prisma.ledgerEntry.createMany({
    data: [
      {
        direction: 'IN',
        category: 'BUDGET_ALLOCATION',
        amountPaise: BigInt(30000000), // ₹3,00,000
        sourceType: 'ALLOCATION',
        sourceId: allocation.id,
        description: 'University Grant 2026-ODD initial allocation',
        recordedById: createdUsers['mentor@nirmauni.ac.in'].id,
        occurredAt: new Date(Date.now() - 90 * 24 * 3600000),
      },
      {
        direction: 'IN',
        category: 'SPONSORSHIP',
        amountPaise: BigInt(15000000), // ₹1,50,000
        sourceType: 'MANUAL',
        sourceId: '90000000-0000-0000-0000-000000000001',
        description: 'Tech Conclave title sponsorship from CloudInfra Inc.',
        recordedById: createdUsers['treasurer@nirmauni.ac.in'].id,
        occurredAt: new Date(Date.now() - 65 * 24 * 3600000),
      },
      {
        direction: 'IN',
        category: 'DUES',
        amountPaise: BigInt(4500000), // ₹45,000
        sourceType: 'PAYMENT',
        sourceId: '90000000-0000-0000-0000-000000000002',
        description: 'Annual membership dues batch receipt (90 members)',
        recordedById: createdUsers['treasurer@nirmauni.ac.in'].id,
        occurredAt: new Date(Date.now() - 40 * 24 * 3600000),
      },
      {
        direction: 'IN',
        category: 'TICKETS',
        amountPaise: BigInt(3750000), // ₹37,500
        sourceType: 'PAYMENT',
        sourceId: '90000000-0000-0000-0000-000000000003',
        eventId: gala.id,
        description: 'Spring Gala 2026 early bird tickets online batch',
        recordedById: createdUsers['treasurer@nirmauni.ac.in'].id,
        occurredAt: new Date(Date.now() - 15 * 24 * 3600000),
      },
      {
        direction: 'IN',
        category: 'MERCH',
        amountPaise: BigInt(5394000), // ₹53,940
        sourceType: 'PAYMENT',
        sourceId: '90000000-0000-0000-0000-000000000004',
        description: 'Signature Hoodie pre-order payments (60 units)',
        recordedById: createdUsers['treasurer@nirmauni.ac.in'].id,
        occurredAt: new Date(Date.now() - 10 * 24 * 3600000),
      },
      {
        direction: 'IN',
        category: 'FUNDRAISER',
        amountPaise: BigInt(1840000), // ₹18,400
        sourceType: 'CASH_COLLECTION',
        sourceId: '90000000-0000-0000-0000-000000000005',
        projectId: bakeSale.id,
        description: 'Campus Bake Sale day 1 revenue deposit',
        recordedById: createdUsers['treasurer@nirmauni.ac.in'].id,
        occurredAt: new Date(Date.now() - 3 * 24 * 3600000),
      },
      {
        direction: 'OUT',
        category: 'PURCHASE',
        amountPaise: BigInt(5000000), // ₹50,000
        sourceType: 'MANUAL',
        sourceId: '90000000-0000-0000-0000-000000000006',
        eventId: gala.id,
        description: 'Grand Auditorium booking advance payment to LDCE Estate office',
        recordedById: createdUsers['treasurer@nirmauni.ac.in'].id,
        occurredAt: new Date(Date.now() - 25 * 24 * 3600000),
      },
      {
        direction: 'OUT',
        category: 'PURCHASE',
        amountPaise: BigInt(3500000), // ₹35,000
        sourceType: 'MANUAL',
        sourceId: '90000000-0000-0000-0000-000000000007',
        eventId: gala.id,
        description: 'Stage lighting and AV vendor contract deposit',
        recordedById: createdUsers['treasurer@nirmauni.ac.in'].id,
        occurredAt: new Date(Date.now() - 12 * 24 * 3600000),
      },
      {
        direction: 'OUT',
        category: 'REIMBURSEMENT',
        amountPaise: BigInt(480000), // ₹4,800
        sourceType: 'CLAIM',
        sourceId: '90000000-0000-0000-0000-000000000008',
        description: 'Reimbursement: Welcome banners, ID badges, and standees',
        recordedById: createdUsers['treasurer@nirmauni.ac.in'].id,
        occurredAt: new Date(Date.now() - 6 * 24 * 3600000),
      },
      {
        direction: 'OUT',
        category: 'REFUND',
        amountPaise: BigInt(50000), // ₹500
        sourceType: 'REFUND',
        sourceId: '90000000-0000-0000-0000-000000000009',
        description: 'Refund for duplicate workshop registration (Order #902)',
        recordedById: createdUsers['treasurer@nirmauni.ac.in'].id,
        occurredAt: new Date(Date.now() - 2 * 24 * 3600000),
      },
    ],
  });
  // Every paid payment has its ledger row, as the live payment path would post (keeps reconciliation clean on re-seed).
  const LEDGER_CATEGORY = { MEMBERSHIP: 'DUES', TICKET: 'TICKETS', MERCH_ORDER: 'MERCH' };
  const LEDGER_TEXT = { MEMBERSHIP: 'Membership dues (online)', TICKET: 'Ticket sale (online)', MERCH_ORDER: 'Merchandise order (online)' };
  const paidPayments = await prisma.payment.findMany({
    where: { status: { in: ['PAID', 'REFUNDED'] } },
    include: { reservations: { select: { ticketType: { select: { eventId: true } } } } },
  });
  await prisma.ledgerEntry.createMany({
    data: paidPayments.map((p) => ({
      direction: 'IN', category: LEDGER_CATEGORY[p.purpose], amountPaise: p.amountPaise, sourceType: 'PAYMENT', sourceId: p.id,
      eventId: p.reservations[0]?.ticketType.eventId ?? null,
      description: LEDGER_TEXT[p.purpose], occurredAt: p.paidAt ?? p.createdAt,
    })),
    skipDuplicates: true,
  });

  // Seed Cash Collections across all verification states (PENDING_VERIFICATION, VERIFIED, REJECTED)
  await prisma.cashCollection.deleteMany({});
  await prisma.cashCollection.createMany({
    data: [
      {
        id: '91000000-0000-0000-0000-000000000001',
        collectedById: createdUsers['cashdesk@nirmauni.ac.in'].id,
        payerUserId: createdUsers['student4@nirmauni.ac.in'].id,
        refId: '91000000-0000-0000-0000-000000000021',
        amountPaise: BigInt(50000), // ₹500
        purpose: 'MEMBERSHIP',
        status: 'PENDING_VERIFICATION',
        createdAt: new Date(Date.now() - 1 * 24 * 3600000),
      },
      {
        id: '91000000-0000-0000-0000-000000000002',
        collectedById: createdUsers['door@nirmauni.ac.in'].id,
        payerUserId: createdUsers['student5@nirmauni.ac.in'].id,
        refId: '91000000-0000-0000-0000-000000000022',
        amountPaise: BigInt(300000), // ₹3,000
        purpose: 'TICKET',
        status: 'PENDING_VERIFICATION',
        createdAt: new Date(Date.now() - 2 * 24 * 3600000),
      },
      {
        id: '91000000-0000-0000-0000-000000000003',
        collectedById: createdUsers['cashdesk@nirmauni.ac.in'].id,
        refId: '91000000-0000-0000-0000-000000000023',
        amountPaise: BigInt(89900), // ₹899
        purpose: 'MERCH',
        status: 'PENDING_VERIFICATION',
        createdAt: new Date(),
      },
      {
        id: '91000000-0000-0000-0000-000000000004',
        collectedById: createdUsers['cashdesk@nirmauni.ac.in'].id,
        refId: '91000000-0000-0000-0000-000000000024',
        amountPaise: BigInt(119800), // ₹1,198
        purpose: 'MERCH',
        status: 'VERIFIED',
        verifiedById: createdUsers['treasurer@nirmauni.ac.in'].id,
        verifiedAt: new Date(Date.now() - 2 * 24 * 3600000),
        createdAt: new Date(Date.now() - 3 * 24 * 3600000),
      },
      {
        id: '91000000-0000-0000-0000-000000000005',
        collectedById: createdUsers['door@nirmauni.ac.in'].id,
        refId: '91000000-0000-0000-0000-000000000025',
        amountPaise: BigInt(40000), // ₹400
        purpose: 'TICKET',
        status: 'REJECTED',
        verifiedById: createdUsers['treasurer@nirmauni.ac.in'].id,
        verifiedAt: new Date(Date.now() - 1 * 24 * 3600000),
        rejectReason: 'Discrepancy in spot cash count at auditorium entrance',
        createdAt: new Date(Date.now() - 1 * 24 * 3600000),
      },
    ],
  });

  // Seed Expense Claims across all statuses: SUBMITTED, APPROVED, PAID, REJECTED
  const sampleClaims = [
    {
      id: '60000000-0000-0000-0000-000000000001',
      submittedById: createdUsers['volunteer1@nirmauni.ac.in'].id,
      amountPaise: BigInt(250000), // ₹2,500
      category: 'REIMBURSEMENT',
      route: 'STANDARD',
      description: 'Bake Sale packaging supplies: airtight boxes, napkins, ribbons',
      status: 'SUBMITTED', // Ready for Treasurer to approve
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
      status: 'SUBMITTED', // Ready for review
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
      status: 'APPROVED', // Ready for Treasurer to pay
      spentAt: new Date(Date.now() - 5 * 24 * 3600000),
      eventId: hackathon.id, // claims must link to an event/project/task (DB check)
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
      eventId: hackathon.id, // claims must link to an event/project/task (DB check)
    },
    {
      id: '60000000-0000-0000-0000-000000000005',
      submittedById: createdUsers['volunteer3@nirmauni.ac.in'].id,
      amountPaise: BigInt(120000), // ₹1,200
      category: 'REIMBURSEMENT',
      route: 'STANDARD',
      description: 'Personal travel expenses for sponsor meetup across town',
      status: 'REJECTED',
      spentAt: new Date(Date.now() - 8 * 24 * 3600000),
      eventId: gala.id, // claims must link to an event/project/task (DB check)
    },
    {
      id: '60000000-0000-0000-0000-000000000006',
      submittedById: createdUsers['marketinghead@nirmauni.ac.in'].id,
      amountPaise: BigInt(850000), // ₹8,500
      category: 'PURCHASE',
      route: 'HIGH_VALUE',
      description: 'Four custom roll-up standees and grand backdrop vinyl banner for Spring Gala',
      status: 'SUBMITTED', // Tests HIGH_VALUE route queue
      spentAt: new Date(Date.now() - 1 * 24 * 3600000),
      eventId: gala.id,
    },
  ];

  for (const c of sampleClaims) {
    await prisma.expenseClaim.upsert({
      where: { id: c.id },
      update: { status: c.status, description: c.description, route: c.route, paidReference: c.paidReference },
      create: c,
    });
  }
  console.log('✓ Seeded budget limits, allocations, multi-month ledger, cash desk entries, and claims');

  // ===================================
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
    {
      id: '71000000-0000-0000-0000-000000000004',
      role: 'MARKETING_HEAD',
      seats: 1,
      description: 'Oversee digital campaigns, social media branding, photography, and press outreach.',
      minMembershipDays: 20,
      questions: [
        {
          id: '72000000-0000-0000-0000-000000000005',
          sortOrder: 1,
          label: 'How would you scale club Instagram engagement and reel impressions by 3x?',
          type: 'TEXTAREA',
          required: true,
        },
      ],
    },
    {
      id: '71000000-0000-0000-0000-000000000005',
      role: 'SPONSORSHIP_HEAD',
      seats: 1,
      description: 'Build sponsor relationships, manage the Odoo CRM pipeline, and coordinate event sponsorship commitments.',
      minMembershipDays: 20,
      questions: [
        {
          id: '72000000-0000-0000-0000-000000000006',
          sortOrder: 1,
          label: 'How would you identify, approach, and follow up with sponsors for a major student event?',
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

  // Seed sample applications across all review stages: SUBMITTED, SHORTLISTED, INTERVIEW, REJECTED, APPOINTED
  const eventPost = await prisma.selectionPost.findFirst({ where: { cycleId: cycle.id, role: 'EVENT_HEAD' }, include: { questions: true } });
  const treasurerPost = await prisma.selectionPost.findFirst({ where: { cycleId: cycle.id, role: 'TREASURER' }, include: { questions: true } });
  const volunteerPost = await prisma.selectionPost.findFirst({ where: { cycleId: cycle.id, role: 'VOLUNTEER_HEAD' }, include: { questions: true } });
  const marketingPost = await prisma.selectionPost.findFirst({ where: { cycleId: cycle.id, role: 'MARKETING_HEAD' }, include: { questions: true } });

  const sampleApps = [
    {
      id: '73000000-0000-0000-0000-000000000001',
      postId: eventPost.id,
      applicantId: createdUsers['student1@nirmauni.ac.in'].id,
      status: 'SUBMITTED',
      answers: [
        { questionId: eventPost.questions[0]?.id, value: 'I plan to host a statewide Robotics Olympiad and an AI Career Summit with leading founders.' },
        { questionId: eventPost.questions[1]?.id, value: 'Managed sudden power outages during our department tech fest by routing emergency generators within 10 minutes.' },
      ],
    },
    {
      id: '73000000-0000-0000-0000-000000000002',
      postId: eventPost.id,
      applicantId: createdUsers['student2@nirmauni.ac.in'].id,
      status: 'SHORTLISTED',
      reviewerNote: 'Strong campus operations track record and great stage coordination.',
      answers: [
        { questionId: eventPost.questions[0]?.id, value: 'Introduce monthly musical unplugged jams and an inter-hostel esport tournament.' },
        { questionId: eventPost.questions[1]?.id, value: 'Handled delayed speaker flights by restructuring the schedule smoothly without participant downtime.' },
      ],
    },
    {
      id: '73000000-0000-0000-0000-000000000003',
      postId: treasurerPost.id,
      applicantId: createdUsers['student3@nirmauni.ac.in'].id,
      status: 'INTERVIEW',
      reviewerNote: 'Interview scheduled for Tuesday 4:00 PM in Conference Room A.',
      answers: [
        { questionId: treasurerPost.questions[0]?.id, value: 'Proficient in Excel, Google Sheets, Tally ERP, and automated reconciliation with UPI webhooks.' },
      ],
    },
    {
      id: '73000000-0000-0000-0000-000000000004',
      postId: volunteerPost.id,
      applicantId: createdUsers['student4@nirmauni.ac.in'].id,
      status: 'REJECTED',
      reviewerNote: 'Does not meet minimum 15 days active membership requirement.',
      answers: [
        { questionId: volunteerPost.questions[0]?.id, value: 'Recognize top volunteers with weekly badge spotlight cards and priority access to tech swag.' },
      ],
    },
    {
      id: '73000000-0000-0000-0000-000000000005',
      postId: marketingPost.id,
      applicantId: createdUsers['student6@nirmauni.ac.in'].id,
      status: 'APPOINTED',
      reviewerNote: 'Exceptional visual design portfolio and video editing capabilities. Appointed as Associate Marketing Head.',
      answers: [
        { questionId: marketingPost.questions[0]?.id, value: 'Produce behind-the-scenes reels, student spotlights, and cinematic teaser cuts 2 weeks prior to flagship events.' },
      ],
    },
  ];

  await prisma.applicationAnswer.deleteMany({});
  await prisma.application.deleteMany({});

  for (const app of sampleApps) {
    await prisma.application.create({
      data: {
        id: app.id,
        postId: app.postId,
        applicantId: app.applicantId,
        status: app.status,
        reviewerNote: app.reviewerNote,
        answers: {
          create: app.answers.filter(a => a.questionId),
        },
      },
    });
  }
  console.log('✓ Seeded governance cycle, posts, and applications across SUBMITTED, SHORTLISTED, INTERVIEW, REJECTED, and APPOINTED');

  // ==========================================
  // 10. Meetings & Agendas
  // ==========================================
  async function upsertMeeting({ id, title, startAt, endAt, location, audience, status = 'SCHEDULED', createdById, agendaItems, invites }) {
    const meeting = await prisma.meeting.upsert({
      where: { id },
      update: { title, startAt, endAt, location, audience, status },
      create: { id, title, startAt, endAt, location, audience, status, createdById },
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
      const respondedAt = inv.rsvp === 'PENDING' ? null : new Date(); // DB check: answered <=> respondedAt set
      await prisma.meetingInvite.upsert({
        where: { meetingId_userId: { meetingId: meeting.id, userId: inv.userId } },
        update: { rsvp: inv.rsvp, respondedAt },
        create: {
          meetingId: meeting.id,
          userId: inv.userId,
          rsvp: inv.rsvp,
          respondedAt,
        },
      });
    }
    return meeting;
  }

  // 10.1 Upcoming Leadership Meeting
  await upsertMeeting({
    id: '80000000-0000-0000-0000-000000000001',
    title: 'Executive Council Bi-Weekly Planning & Budget Review',
    startAt: atIST(3, 16),
    endAt: new Date(atIST(3, 16).getTime() + 90 * 60000),
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

  // 10.2 Upcoming Volunteer Briefing
  await upsertMeeting({
    id: '80000000-0000-0000-0000-000000000002',
    title: 'Spring Gala All-Hands Volunteer Briefing',
    startAt: atIST(10, 15),
    endAt: new Date(atIST(10, 15).getTime() + 60 * 60000),
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

  // 10.3 Completed Historical Meeting
  await upsertMeeting({
    id: '80000000-0000-0000-0000-000000000003',
    title: 'Semester Kickoff & Membership Drive Retrospective',
    startAt: atIST(-20, 11),
    endAt: new Date(atIST(-20, 11).getTime() + 45 * 60000),
    location: 'Seminar Hall 2',
    audience: 'LEADERS',
    status: 'COMPLETED',
    createdById: createdUsers['president@nirmauni.ac.in'].id,
    agendaItems: [
      { sortOrder: 1, topic: 'Final count of verified student memberships', durationMin: 20, ownerId: createdUsers['treasurer@nirmauni.ac.in'].id },
      { sortOrder: 2, topic: 'Campus desk cash reconciliations', durationMin: 15, ownerId: createdUsers['cashdesk@nirmauni.ac.in'].id },
    ],
    invites: [
      { userId: createdUsers['president@nirmauni.ac.in'].id, rsvp: 'YES' },
      { userId: createdUsers['treasurer@nirmauni.ac.in'].id, rsvp: 'YES' },
    ],
  });
  console.log('✓ Seeded upcoming and completed meetings with agendas and RSVPs');

  // ==========================================
  // 11. Announcements & Updates Feed
  // ==========================================
  const announcementsToSeed = [
    {
      id: '90000000-0000-0000-0000-000000000010',
      title: 'Welcome to the New Skyline Organization Platform!',
      bodyMd: 'We are thrilled to launch the new centralized platform for LDCE & Nirma students. Access digital membership cards, discounted event tickets, official hoodies, and transparent student governance all in one place.',
      audience: 'PUBLIC',
      status: 'PUBLISHED',
      publishedAt: new Date(Date.now() - 10 * 24 * 3600000),
      authorId: createdUsers['president@nirmauni.ac.in'].id,
    },
    {
      id: '90000000-0000-0000-0000-000000000011',
      title: 'Spring Gala 2026 Ticket Sales Now Live',
      bodyMd: 'Early bird tickets for the flagship Spring Gala 2026 are now open for verified members at 50% discount. Make sure to claim your tickets early before quotas fill up.',
      audience: 'MEMBERS',
      status: 'PUBLISHED',
      publishedAt: new Date(Date.now() - 5 * 24 * 3600000),
      authorId: createdUsers['eventhead@nirmauni.ac.in'].id,
    },
    {
      id: '90000000-0000-0000-0000-000000000012',
      title: 'Call for Volunteers: CodeWave LDCE Hackathon 2026',
      bodyMd: 'Join the organizing committee as a volunteer for technical setup, hacker logistics, catering, and social coverage. Receive an official certificate of appreciation.',
      audience: 'PUBLIC',
      status: 'PUBLISHED',
      publishedAt: new Date(Date.now() - 2 * 24 * 3600000),
      authorId: createdUsers['volunteerhead@nirmauni.ac.in'].id,
    },
    {
      id: '90000000-0000-0000-0000-000000000013',
      title: 'Campus Lost & Found Protocols & Central Desk Hours',
      bodyMd: 'All misplaced student cards, keys, water flasks, and calculators found in academic blocks can be claimed at the Skyline Desk (Admin Block Counter B) from 1:00 PM to 4:00 PM daily.',
      audience: 'PUBLIC',
      status: 'PUBLISHED',
      publishedAt: new Date(Date.now() - 1 * 24 * 3600000),
      authorId: createdUsers['president@nirmauni.ac.in'].id,
    },
  ];

  for (const a of announcementsToSeed) {
    await prisma.announcement.upsert({
      where: { id: a.id },
      update: { title: a.title, bodyMd: a.bodyMd, audience: a.audience, status: a.status },
      create: a,
    });
  }
  console.log('✓ Seeded official announcements across public and members-only audiences');

  // ==========================================
  // 12. Newsletter Subscribers
  // ==========================================
  const subscribers = [
    { email: 'student1@nirmauni.ac.in', name: 'Pooja Trivedi', status: 'SUBSCRIBED' },
    { email: 'student2@nirmauni.ac.in', name: 'Harsh Dave', status: 'SUBSCRIBED' },
    { email: 'student3@nirmauni.ac.in', name: 'Meera Nair', status: 'SUBSCRIBED' },
    { email: 'student4@nirmauni.ac.in', name: 'Devansh Bhatt', status: 'SUBSCRIBED' },
    { email: 'student5@nirmauni.ac.in', name: 'Tanvi Joshi', status: 'SUBSCRIBED' },
    { email: 'student6@nirmauni.ac.in', name: 'Aditya Shah', status: 'SUBSCRIBED' },
    { email: 'alumni.tech@ldce.ac.in', name: 'Kunal Parmar', status: 'SUBSCRIBED' },
    { email: 'robotics.club@ldce.ac.in', name: 'LDCE Robotics', status: 'SUBSCRIBED' },
  ];
  for (const sub of subscribers) {
    const unsubscribeTokenHash = crypto.createHash('sha256').update(sub.email).digest('hex');
    await prisma.newsletterSubscriber.upsert({
      where: { email: sub.email },
      update: { status: sub.status, name: sub.name },
      create: {
        ...sub,
        unsubscribeTokenHash,
      },
    });
  }
  console.log('✓ Seeded newsletter subscribers');

  // ==========================================
  // 13. In-App Notifications
  // ==========================================
  const sampleNotifications = [
    {
      userId: createdUsers['student1@nirmauni.ac.in'].id,
      title: 'Spring Gala Ticket Confirmed',
      body: 'Your ticket for Spring Gala 2026 has been issued. Show your digital pass at the door scanner.',
      type: 'TICKETING',
      link: '/me/tickets',
      readAt: null,
    },
    {
      userId: createdUsers['student1@nirmauni.ac.in'].id,
      title: 'Order Marked Ready for Pickup',
      body: 'Your Signature Hoodie (M) is packed and ready for collection at Counter B.',
      type: 'MERCH',
      link: '/me/orders',
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
      userId: createdUsers['mentor@nirmauni.ac.in'].id,
      title: 'Event Proposal Awaiting Review',
      body: 'Rohan Mehta submitted "RoboWars & Drone Grand Prix 2026" for your faculty mentor review.',
      type: 'GOVERNANCE',
      link: '/manage/events/30000000-0000-0000-0000-000000000004/review',
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
  console.log('✓ Seeded in-app notifications across students, leaders, volunteers, and mentor');

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
