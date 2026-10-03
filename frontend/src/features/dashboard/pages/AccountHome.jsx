import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

export default function AccountHome() {
  const { data: authData, isLoading: authLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const res = await fetch("/api/v1/auth/me", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
  });

  const { data: ticketsData } = useQuery({
    queryKey: ['tickets', 'me'],
    queryFn: async () => {
      const res = await fetch("/api/v1/tickets/me", { credentials: "include" });
      if (!res.ok) return { data: [] };
      return res.json();
    },
    retry: false,
  });

  const user = authData?.data;
  const tickets = ticketsData?.data || [];
  const nextTicket = tickets[0];

  if (authLoading) return <div className="p-12 text-center text-[var(--color-muted)]">Loading your account...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pb-6 border-b border-[var(--color-line)]">
        <div>
          <h1 className="text-3xl font-display font-extrabold text-[var(--color-ink)]">
            Welcome, {user?.name || "Student"}
          </h1>
          <p className="text-sm font-mono text-[var(--color-muted)] mt-1">
            Student ID: {user?.studentId || "23BCE301"} • {user?.roles?.length ? user.roles.join(', ') : 'Student Member'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/me/membership"
            className="px-4 py-2 rounded-lg bg-[var(--color-dusk)] text-white font-bold text-xs hover:bg-opacity-90 shadow-sm"
          >
            Digital Membership Card &rarr;
          </Link>
        </div>
      </div>

      {/* Grid of Key Account Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">

        {/* Membership Tile */}
        <Link to="/me/membership" className="block bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-4">Membership</p>
          {user?.membership?.status === 'ACTIVE' ? (
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-[var(--color-ok)] rounded-full"></span>
                <span className="font-bold text-[var(--color-ink)] text-lg">Active Member</span>
              </div>
              <p className="text-xs text-[var(--color-muted)] mt-2">
                {user.membership.expiresAt ? `Valid until ${new Date(user.membership.expiresAt).toLocaleDateString()}` : 'Full access unlocked'}
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-[var(--color-stop)] rounded-full"></span>
                <span className="font-bold text-[var(--color-ink)] text-lg">Not Active</span>
              </div>
              <p className="text-xs text-[var(--color-dusk)] mt-2 font-medium">Join now for 50% perks &rarr;</p>
            </div>
          )}
        </Link>

        {/* Tickets Tile */}
        <Link to="/me/tickets" className="block bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-4">Event Passes</p>
          {nextTicket ? (
            <div>
              <p className="font-bold text-[var(--color-ink)] truncate" title={nextTicket.event?.title || "Event"}>
                {nextTicket.event?.title || "Upcoming Event"}
              </p>
              <p className="text-xs text-[var(--color-muted)] mt-2">
                {nextTicket.event?.startAt ? new Date(nextTicket.event.startAt).toLocaleDateString() : 'Pass ready'}
              </p>
            </div>
          ) : (
            <div>
              <p className="font-bold text-[var(--color-ink)] text-lg">0 Tickets</p>
              <p className="text-xs text-[var(--color-dusk)] mt-2 font-medium">Browse events &rarr;</p>
            </div>
          )}
        </Link>

        {/* Orders Tile */}
        <Link to="/me/orders" className="block bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-4">Merch Orders</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-display font-bold text-[var(--color-ink)] leading-none">0</span>
            <span className="text-xs text-[var(--color-muted)] mb-1">active</span>
          </div>
          <p className="text-xs text-[var(--color-dusk)] mt-2 font-medium">View shop catalog &rarr;</p>
        </Link>

        {/* Volunteer/Tasks Tile */}
        <Link to="/volunteer" className="block bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-4">Volunteering</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-display font-bold text-[var(--color-ink)] leading-none">
              {user?.isVolunteer ? 'Active' : 'Open'}
            </span>
          </div>
          <p className="text-xs text-[var(--color-dusk)] mt-2 font-medium">Open portal &rarr;</p>
        </Link>
      </div>

      {/* Quick Action Navigation Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/events" className="p-4 bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl hover:shadow-sm transition-all flex items-center justify-between">
          <div>
            <div className="font-bold text-sm text-[var(--color-ink)]">Upcoming Events</div>
            <div className="text-xs text-[var(--color-muted)]">Register with member discount</div>
          </div>
          <span className="text-[var(--color-dusk)] font-bold">&rarr;</span>
        </Link>

        <Link to="/selection" className="p-4 bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl hover:shadow-sm transition-all flex items-center justify-between">
          <div>
            <div className="font-bold text-sm text-[var(--color-ink)]">Leadership Applications</div>
            <div className="text-xs text-[var(--color-muted)]">Apply for executive roles</div>
          </div>
          <span className="text-[var(--color-dusk)] font-bold">&rarr;</span>
        </Link>

        <Link to="/announcements" className="p-4 bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl hover:shadow-sm transition-all flex items-center justify-between">
          <div>
            <div className="font-bold text-sm text-[var(--color-ink)]">Campus News & Feeds</div>
            <div className="text-xs text-[var(--color-muted)]">Official organization notices</div>
          </div>
          <span className="text-[var(--color-dusk)] font-bold">&rarr;</span>
        </Link>
      </div>
    </div>
  );
}
