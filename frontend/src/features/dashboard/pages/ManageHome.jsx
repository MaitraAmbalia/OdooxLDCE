import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

export default function ManageHome() {
  const { data: countsData, isLoading } = useQuery({
    queryKey: ['dashboard', 'counts'],
    queryFn: async () => {
      // API endpoint: GET /dashboard/counts
      const res = await fetch("/api/v1/dashboard/counts");
      if (!res.ok) throw new Error("Failed to fetch dashboard counts");
      return res.json();
    }
  });

  if (isLoading) return <div className="p-12 text-center text-[var(--color-muted)]">Loading dashboard...</div>;

  const counts = countsData?.data || {
    claimsPending: 0,
    ordersToPack: 0,
    proposalsToReview: 0,
    activeTasks: 0
  };

  const queueStrips = [
    {
      title: "Expense Claims",
      count: counts.claimsPending,
      description: "Awaiting your approval",
      link: "/manage/claims",
      color: "border-[var(--color-stop)] text-[var(--color-stop)]"
    },
    {
      title: "Fulfilment Queue",
      count: counts.ordersToPack,
      description: "Paid orders ready to pack",
      link: "/manage/orders",
      color: "border-[var(--color-info)] text-[var(--color-info)]"
    },
    {
      title: "Event Proposals",
      count: counts.proposalsToReview,
      description: "Require mentor review",
      link: "/manage/events/new", // Assuming a review queue would be here
      color: "border-[var(--color-wait)] text-[var(--color-wait)]"
    },
    {
      title: "Active Tasks",
      count: counts.activeTasks,
      description: "Assigned to your teams",
      link: "/manage/projects",
      color: "border-[var(--color-ok)] text-[var(--color-ok)]"
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-extrabold text-[var(--color-ink)]">Leadership Hub</h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">Focus on what needs your attention right now.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {queueStrips.map((strip, idx) => (
          <Link key={idx} to={strip.link} className="block group">
            <div className={`bg-[var(--color-surface)] border-l-4 ${strip.color} border-y border-r border-[var(--color-line)] rounded-r-[10px] p-6 shadow-sm hover:shadow-md transition-all h-full flex flex-col justify-between`}>
              <div>
                <p className="text-4xl font-display font-bold text-[var(--color-ink)] mb-2">{strip.count}</p>
                <h3 className="font-bold text-[var(--color-ink)]">{strip.title}</h3>
                <p className="text-xs text-[var(--color-muted)] mt-1">{strip.description}</p>
              </div>
              <div className="mt-6 text-sm font-medium text-[var(--color-dusk)] group-hover:underline">
                Review &rarr;
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[10px] p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[var(--color-ink)] mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link to="/manage/announcements/new" className="p-3 border border-[var(--color-line)] rounded-[6px] text-sm font-medium hover:bg-[var(--color-paper)] flex items-center justify-between">
              Post Announcement <span>📢</span>
            </Link>
            <Link to="/manage/meetings/new" className="p-3 border border-[var(--color-line)] rounded-[6px] text-sm font-medium hover:bg-[var(--color-paper)] flex items-center justify-between">
              Schedule Meeting <span>📅</span>
            </Link>
            <Link to="/cash-desk" className="p-3 border border-[var(--color-line)] rounded-[6px] text-sm font-medium hover:bg-[var(--color-paper)] flex items-center justify-between">
              Open Cash Desk <span>💵</span>
            </Link>
            <Link to="/manage/finance/ledger" className="p-3 border border-[var(--color-line)] rounded-[6px] text-sm font-medium hover:bg-[var(--color-paper)] flex items-center justify-between">
              View Ledger <span>📊</span>
            </Link>
          </div>
        </div>

        {/* Directory Access */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[10px] p-6 shadow-sm flex flex-col justify-center items-center text-center">
          <h2 className="text-lg font-bold text-[var(--color-ink)] mb-2">Member Directory</h2>
          <p className="text-sm text-[var(--color-muted)] mb-6">Need to look up a student's membership status or contact details?</p>
          <button className="bg-[var(--color-paper)] border border-[var(--color-line)] px-6 py-2 rounded-full text-sm font-bold text-[var(--color-ink)] hover:border-[var(--color-dusk)] transition-colors">
            Search Directory (Ctrl+K)
          </button>
        </div>
      </div>
    </div>
  );
}
