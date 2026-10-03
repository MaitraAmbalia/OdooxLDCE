import React from "react";
import { BarChart3, Calendar, HandHelping, Landmark, Megaphone, Ticket } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

export default function ManageHome() {
  const { data: authData } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const res = await fetch("/api/v1/auth/me", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
  });

  const { data: countsData, isLoading } = useQuery({
    queryKey: ['dashboard', 'counts'],
    queryFn: async () => {
      try {
        const res = await fetch("/api/v1/dashboard/counts", { credentials: "include" });
        if (!res.ok) return { data: { claimsPending: 1, ordersToPack: 0, proposalsToReview: 1, activeTasks: 3 } };
        return res.json();
      } catch (e) {
        return { data: { claimsPending: 1, ordersToPack: 0, proposalsToReview: 1, activeTasks: 3 } };
      }
    },
    retry: false,
  });

  const user = authData?.data;
  const counts = countsData?.data || {
    claimsPending: 1,
    ordersToPack: 0,
    proposalsToReview: 1,
    activeTasks: 3
  };

  const isRole = (role) => user?.roles?.includes(role);

  const queueStrips = [
    {
      title: "Expense Claims",
      count: counts.claimsPending,
      description: "Awaiting Treasurer review",
      link: "/manage/claims",
      color: "border-[var(--color-stop)] text-[var(--color-stop)]",
      badge: "Finance"
    },
    {
      title: "Event Proposals",
      count: counts.proposalsToReview,
      description: "Require Mentor authorization",
      link: "/manage/events/00000000-0000-0000-0000-000000000001/review",
      color: "border-[var(--color-wait)] text-[var(--color-wait)]",
      badge: "Mentor"
    },
    {
      title: "Active Tasks",
      count: counts.activeTasks,
      description: "Assigned to fundraiser volunteers",
      link: "/manage/projects",
      color: "border-[var(--color-ok)] text-[var(--color-ok)]",
      badge: "Volunteers"
    },
    {
      title: "Merch Fulfilment",
      count: counts.ordersToPack,
      description: "Paid orders ready for packing",
      link: "/manage/orders",
      color: "border-[var(--color-info)] text-[var(--color-info)]",
      badge: "Shop"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pb-6 border-b border-[var(--color-line)]">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 text-[var(--color-dusk)] mb-2">
            Executive Command Center
          </div>
          <h1 className="text-3xl font-display font-extrabold text-[var(--color-ink)]">
            Organization Management Hub
          </h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            Logged in as <span className="font-semibold text-[var(--color-ink)]">{user?.name}</span> ({user?.roles?.join(', ') || 'Staff'})
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/manage/events/new"
            className="px-4 py-2 rounded-lg bg-[var(--color-dusk)] text-white font-bold text-xs hover:bg-opacity-90 shadow-sm"
          >
            + Propose Event
          </Link>
          <Link
            to="/manage/meetings/new"
            className="px-4 py-2 rounded-lg bg-[var(--color-paper)] border border-[var(--color-line)] text-[var(--color-ink)] font-bold text-xs hover:border-[var(--color-dusk)]"
          >
            + Schedule Meeting
          </Link>
          <Link
            to="/manage/announcements/new"
            className="px-4 py-2 rounded-lg bg-[var(--color-paper)] border border-[var(--color-line)] text-[var(--color-ink)] font-bold text-xs hover:border-[var(--color-dusk)]"
          >
            + Post Announcement
          </Link>
        </div>
      </div>

      {/* Decision Queues Strip */}
      <div className="mb-12">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-muted)] mb-4">
          Priority Decision Queues
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {queueStrips.map((strip, idx) => (
            <Link key={idx} to={strip.link} className="block group">
              <div className={`bg-[var(--color-surface)] border-l-4 ${strip.color} border-y border-r border-[var(--color-line)] rounded-r-xl p-5 shadow-sm hover:shadow-md transition-all h-full flex flex-col justify-between`}>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)] px-2 py-0.5 rounded bg-[var(--color-paper)] border border-[var(--color-line)]">
                      {strip.badge}
                    </span>
                    <span className="text-xs text-[var(--color-dusk)] group-hover:translate-x-0.5 transition-transform font-bold">
                      &rarr;
                    </span>
                  </div>
                  <p className="text-3xl font-display font-extrabold text-[var(--color-ink)] mb-1">{strip.count}</p>
                  <h3 className="font-bold text-[var(--color-ink)] text-sm">{strip.title}</h3>
                  <p className="text-xs text-[var(--color-muted)] mt-1">{strip.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Department Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* 1. Governance & Oversight (Mentor / President) */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Landmark className="w-5 h-5 text-blue-600" aria-hidden="true" />
            <div>
              <h3 className="font-bold text-[var(--color-ink)] text-base">Governance & Mentorship</h3>
              <p className="text-xs text-[var(--color-muted)]">Faculty oversight & elections</p>
            </div>
          </div>
          <div className="space-y-2">
            <Link to="/manage/events/00000000-0000-0000-0000-000000000001/review" className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--color-line)] hover:bg-[var(--color-paper)] text-xs font-semibold text-[var(--color-ink)]">
              <span>Event Proposal Review & Diff</span>
              <span className="text-[var(--color-dusk)]">&rarr;</span>
            </Link>
            <Link to="/manage/selection/00000000-0000-0000-0000-000000000001/edit" className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--color-line)] hover:bg-[var(--color-paper)] text-xs font-semibold text-[var(--color-ink)]">
              <span>Election Cycle & Question Builder</span>
              <span className="text-[var(--color-dusk)]">&rarr;</span>
            </Link>
            <Link to="/manage/selection/00000000-0000-0000-0000-000000000001/applications" className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--color-line)] hover:bg-[var(--color-paper)] text-xs font-semibold text-[var(--color-ink)]">
              <span>Candidate Applications & Review</span>
              <span className="text-[var(--color-dusk)]">&rarr;</span>
            </Link>
            <Link to="/manage/budget" className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--color-line)] hover:bg-[var(--color-paper)] text-xs font-semibold text-[var(--color-ink)]">
              <span>Semester Budget Allocations</span>
              <span className="text-[var(--color-dusk)]">&rarr;</span>
            </Link>
          </div>
        </div>

        {/* 2. Executive Leadership & Meetings (President) */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-blue-600" aria-hidden="true" />
            <div>
              <h3 className="font-bold text-[var(--color-ink)] text-base">Executive & Meetings</h3>
              <p className="text-xs text-[var(--color-muted)]">Presidential agenda & coordination</p>
            </div>
          </div>
          <div className="space-y-2">
            <Link to="/manage/meetings" className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--color-line)] hover:bg-[var(--color-paper)] text-xs font-semibold text-[var(--color-ink)]">
              <span>Club & Event Meetings Roster</span>
              <span className="text-[var(--color-dusk)]">&rarr;</span>
            </Link>
            <Link to="/manage/meetings/new" className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--color-line)] hover:bg-[var(--color-paper)] text-xs font-semibold text-[var(--color-ink)]">
              <span>+ Schedule Meeting & Agenda</span>
              <span className="text-[var(--color-dusk)]">&rarr;</span>
            </Link>
            <Link to="/manage/claims" className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--color-line)] hover:bg-[var(--color-paper)] text-xs font-semibold text-[var(--color-ink)]">
              <span>High-Value Claims Review (&gt; ₹2k)</span>
              <span className="text-[var(--color-dusk)]">&rarr;</span>
            </Link>
          </div>
        </div>

        {/* 3. Finance & Ledgers (Treasurer) */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-blue-600" aria-hidden="true" />
            <div>
              <h3 className="font-bold text-[var(--color-ink)] text-base">Treasury & Accounting</h3>
              <p className="text-xs text-[var(--color-muted)]">Double-entry ledger & reimbursements</p>
            </div>
          </div>
          <div className="space-y-2">
            <Link to="/manage/finance/ledger" className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--color-line)] hover:bg-[var(--color-paper)] text-xs font-semibold text-[var(--color-ink)]">
              <span>Double-Entry General Ledger</span>
              <span className="text-[var(--color-dusk)]">&rarr;</span>
            </Link>
            <Link to="/manage/claims" className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--color-line)] hover:bg-[var(--color-paper)] text-xs font-semibold text-[var(--color-ink)]">
              <span>Volunteer Reimbursement Queue</span>
              <span className="text-[var(--color-dusk)]">&rarr;</span>
            </Link>
            <Link to="/manage/cash" className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--color-line)] hover:bg-[var(--color-paper)] text-xs font-semibold text-[var(--color-ink)]">
              <span>Cash Collection Verification</span>
              <span className="text-[var(--color-dusk)]">&rarr;</span>
            </Link>
            <Link to="/manage/finance/reports" className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--color-line)] hover:bg-[var(--color-paper)] text-xs font-semibold text-[var(--color-ink)]">
              <span>Financial Reports & CSV Export</span>
              <span className="text-[var(--color-dusk)]">&rarr;</span>
            </Link>
          </div>
        </div>

        {/* 4. Events & Ticketing (Event Head) */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Ticket className="w-5 h-5 text-blue-600" aria-hidden="true" />
            <div>
              <h3 className="font-bold text-[var(--color-ink)] text-base">Events & Ticketing</h3>
              <p className="text-xs text-[var(--color-muted)]">Proposals, quotas & door check-in</p>
            </div>
          </div>
          <div className="space-y-2">
            <Link to="/manage/events/new" className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--color-line)] hover:bg-[var(--color-paper)] text-xs font-semibold text-[var(--color-ink)]">
              <span>Event Proposal Stepper (5-step)</span>
              <span className="text-[var(--color-dusk)]">&rarr;</span>
            </Link>
            <Link to="/events" className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--color-line)] hover:bg-[var(--color-paper)] text-xs font-semibold text-[var(--color-ink)]">
              <span>Public Event Catalog</span>
              <span className="text-[var(--color-dusk)]">&rarr;</span>
            </Link>
            <Link to="/door/00000000-0000-0000-0000-000000000001" className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--color-line)] hover:bg-[var(--color-paper)] text-xs font-semibold text-[var(--color-ink)]">
              <span>Full-Screen Door QR Scanner</span>
              <span className="text-[var(--color-dusk)]">&rarr;</span>
            </Link>
          </div>
        </div>

        {/* 5. Fundraisers & Projects (Volunteer Head) */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <HandHelping className="w-5 h-5 text-blue-600" aria-hidden="true" />
            <div>
              <h3 className="font-bold text-[var(--color-ink)] text-base">Projects & Volunteers</h3>
              <p className="text-xs text-[var(--color-muted)]">Kanban task boards & delegation</p>
            </div>
          </div>
          <div className="space-y-2">
            <Link to="/manage/projects" className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--color-line)] hover:bg-[var(--color-paper)] text-xs font-semibold text-[var(--color-ink)]">
              <span>Fundraiser Projects Roster</span>
              <span className="text-[var(--color-dusk)]">&rarr;</span>
            </Link>
            <Link to="/manage/projects/00000000-0000-0000-0000-000000000003" className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--color-line)] hover:bg-[var(--color-paper)] text-xs font-semibold text-[var(--color-ink)]">
              <span>Bake Sale Kanban Task Board</span>
              <span className="text-[var(--color-dusk)]">&rarr;</span>
            </Link>
            <Link to="/volunteer" className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--color-line)] hover:bg-[var(--color-paper)] text-xs font-semibold text-[var(--color-ink)]">
              <span>Volunteer Mobile Dashboard</span>
              <span className="text-[var(--color-dusk)]">&rarr;</span>
            </Link>
          </div>
        </div>

        {/* 6. Communications & Store (Marketing Head) */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Megaphone className="w-5 h-5 text-blue-600" aria-hidden="true" />
            <div>
              <h3 className="font-bold text-[var(--color-ink)] text-base">Comms & Store</h3>
              <p className="text-xs text-[var(--color-muted)]">Announcements, newsletters & merch</p>
            </div>
          </div>
          <div className="space-y-2">
            <Link to="/manage/announcements/new" className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--color-line)] hover:bg-[var(--color-paper)] text-xs font-semibold text-[var(--color-ink)]">
              <span>Compose Targeted Announcement</span>
              <span className="text-[var(--color-dusk)]">&rarr;</span>
            </Link>
            <Link to="/manage/newsletter" className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--color-line)] hover:bg-[var(--color-paper)] text-xs font-semibold text-[var(--color-ink)]">
              <span>Newsletter Campaigns & Stats</span>
              <span className="text-[var(--color-dusk)]">&rarr;</span>
            </Link>
            <Link to="/manage/orders" className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--color-line)] hover:bg-[var(--color-paper)] text-xs font-semibold text-[var(--color-ink)]">
              <span>Merchandise Fulfilment Queue</span>
              <span className="text-[var(--color-dusk)]">&rarr;</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
