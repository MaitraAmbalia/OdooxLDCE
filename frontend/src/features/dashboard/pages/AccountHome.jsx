import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

export default function AccountHome() {
  const { data: meData, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const res = await fetch("/api/v1/auth/me", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
  });

  if (isLoading) return <div className="p-12 text-center text-[var(--color-muted)]">Loading your account...</div>;

  const user = meData?.data;
  const data = {
    user: user ? { name: user.name, studentId: user.studentId } : { name: "Guest Student", studentId: "Not logged in" },
    membership: user?.membership?.status === 'ACTIVE' ? user.membership : null,
    nextTicket: null,
    openOrdersCount: 0,
    activeTasksCount: user?.isVolunteer ? 1 : 0,
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-extrabold text-[var(--color-ink)]">Welcome, {data.user.name}</h1>
        <p className="text-sm font-mono text-[var(--color-muted)] mt-1">{data.user.studentId}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Membership Tile */}
        <Link to="/me/membership" className="block bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[10px] p-6 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-4">Membership</p>
          {data.membership?.status === 'ACTIVE' ? (
            <div>
              <span className="inline-block w-3 h-3 bg-[var(--color-ok)] rounded-full mr-2"></span>
              <span className="font-bold text-[var(--color-ink)] text-lg">Active</span>
              <p className="text-xs text-[var(--color-muted)] mt-2">Valid until {new Date(data.membership.expiresAt).toLocaleDateString()}</p>
            </div>
          ) : (
            <div>
              <span className="inline-block w-3 h-3 bg-[var(--color-stop)] rounded-full mr-2"></span>
              <span className="font-bold text-[var(--color-ink)] text-lg">Inactive</span>
              <p className="text-xs text-[var(--color-dusk)] mt-2 font-medium">Join now for perks &rarr;</p>
            </div>
          )}
        </Link>

        {/* Tickets Tile */}
        <Link to="/me/tickets" className="block bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[10px] p-6 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-4">Next Event</p>
          {data.nextTicket ? (
            <div>
              <p className="font-bold text-[var(--color-ink)] truncate" title={data.nextTicket.eventTitle}>{data.nextTicket.eventTitle}</p>
              <p className="text-xs text-[var(--color-muted)] mt-2">{new Date(data.nextTicket.date).toLocaleDateString()}</p>
            </div>
          ) : (
            <div>
              <p className="font-bold text-[var(--color-ink)] text-lg">No tickets</p>
              <p className="text-xs text-[var(--color-dusk)] mt-2 font-medium">Browse events &rarr;</p>
            </div>
          )}
        </Link>

        {/* Orders Tile */}
        <Link to="/me/orders" className="block bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[10px] p-6 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-4">Shop Orders</p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-display font-bold text-[var(--color-ink)] leading-none">{data.openOrdersCount}</span>
            <span className="text-sm text-[var(--color-muted)] mb-1">active</span>
          </div>
          <p className="text-xs text-[var(--color-dusk)] mt-2 font-medium">View timeline &rarr;</p>
        </Link>

        {/* Volunteer/Tasks Tile */}
        <Link to="/volunteer" className="block bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[10px] p-6 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-4">Volunteer</p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-display font-bold text-[var(--color-ink)] leading-none">{data.activeTasksCount}</span>
            <span className="text-sm text-[var(--color-muted)] mb-1">tasks</span>
          </div>
          <p className="text-xs text-[var(--color-dusk)] mt-2 font-medium">Open dashboard &rarr;</p>
        </Link>

      </div>
    </div>
  );
}
