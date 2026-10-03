import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

export default function Home() {
  const { data: authData } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const res = await fetch("/api/v1/auth/me", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
  });

  const { data: eventsData } = useQuery({
    queryKey: ['events', 'list'],
    queryFn: async () => {
      const res = await fetch("/api/v1/events");
      if (!res.ok) return { data: [] };
      return res.json();
    },
  });

  const user = authData?.data;
  const events = eventsData?.data || [];
  const nextEvent = events[0];

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[var(--color-ink)] to-[#1E293B] text-white py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3B82F6_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--color-lamp)] text-[var(--color-ink)] mb-6 shadow-sm">
            <span>✨</span> Official Student Organization Platform
          </div>
          <h1 className="text-4xl sm:text-6xl font-display font-extrabold tracking-tight mb-6 leading-tight">
            Connect, Lead & Celebrate <br className="hidden sm:inline" />
            <span className="text-[#93C5FD]">at Skyline Association</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-slate-300 mb-8 leading-relaxed">
            The unified campus operating system for club memberships, exclusive event access, merchandise store, student governance, and transparent fiscal tracking.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {user ? (
              <>
                <Link
                  to="/events"
                  className="px-6 py-3 rounded-lg bg-[var(--color-dusk)] text-white font-semibold hover:bg-opacity-90 shadow-md transition-all text-sm"
                >
                  Browse Events
                </Link>
                <Link
                  to="/me"
                  className="px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold transition-all text-sm backdrop-blur-sm"
                >
                  My Student Hub &rarr;
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/join"
                  className="px-7 py-3 rounded-lg bg-[var(--color-lamp)] text-[var(--color-ink)] font-bold hover:brightness-105 shadow-md transition-all text-sm"
                >
                  Join Membership
                </Link>
                <Link
                  to="/events"
                  className="px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold transition-all text-sm backdrop-blur-sm"
                >
                  Upcoming Events &rarr;
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Featured Event Spotlight */}
      {nextEvent && (
        <section className="py-12 bg-[var(--color-surface)] border-b border-[var(--color-line)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 bg-[var(--color-paper)] border border-[var(--color-line)] rounded-2xl p-6 sm:p-8">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[var(--color-lamp)] text-[var(--color-ink)]">
                    Featured Event
                  </span>
                  <span className="text-xs text-[var(--color-muted)] font-medium">
                    {nextEvent.category || "FLAGSHIP"}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-[var(--color-ink)] mb-2">
                  {nextEvent.title}
                </h2>
                <p className="text-[var(--color-muted)] text-sm mb-4 line-clamp-2 max-w-2xl">
                  {nextEvent.description}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--color-ink)] font-medium">
                  <span className="flex items-center gap-1.5">
                    📍 {nextEvent.venue}
                  </span>
                  <span className="flex items-center gap-1.5">
                    🗓️ {new Date(nextEvent.startAt || nextEvent.startDate).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    🎟️ {nextEvent.capacity ? `${nextEvent.capacity - (nextEvent.seatsSold || 0)} seats available` : 'Tickets available'}
                  </span>
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-3">
                <Link
                  to={`/events/${nextEvent.id}`}
                  className="px-6 py-3 rounded-lg bg-[var(--color-dusk)] text-white font-bold text-sm shadow hover:bg-opacity-95 transition-all"
                >
                  Get Tickets &rarr;
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3 Pillars / Value Grid */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-display font-bold text-[var(--color-ink)]">
            Everything in One Campus Platform
          </h2>
          <p className="text-sm text-[var(--color-muted)] mt-2">
            No more lost WhatsApp announcements or cash collection confusions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Membership */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-[var(--color-dusk)] flex items-center justify-center text-2xl mb-4">
                💳
              </div>
              <h3 className="text-xl font-display font-bold text-[var(--color-ink)] mb-2">
                Digital Membership Pass
              </h3>
              <p className="text-sm text-[var(--color-muted)] leading-relaxed mb-4">
                Unlock 50% discount on Gala tickets, special club hoodie pricing, voting rights, and exclusive member-only workshops.
              </p>
            </div>
            <Link
              to="/join"
              className="text-sm font-semibold text-[var(--color-dusk)] hover:underline inline-flex items-center gap-1"
            >
              Explore Tiers & Benefits &rarr;
            </Link>
          </div>

          {/* Card 2: Merchandise Store */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-[var(--color-lamp)] flex items-center justify-center text-2xl mb-4">
                👕
              </div>
              <h3 className="text-xl font-display font-bold text-[var(--color-ink)] mb-2">
                Official Campus Apparel
              </h3>
              <p className="text-sm text-[var(--color-muted)] leading-relaxed mb-4">
                Heavyweight navy fleece hoodies with embroidered crest. Order directly online with your size and pick up on campus.
              </p>
            </div>
            <Link
              to="/shop"
              className="text-sm font-semibold text-[var(--color-dusk)] hover:underline inline-flex items-center gap-1"
            >
              Browse Merchandise &rarr;
            </Link>
          </div>

          {/* Card 3: Governance & Leadership */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[var(--color-ok)] flex items-center justify-center text-2xl mb-4">
                🏛️
              </div>
              <h3 className="text-xl font-display font-bold text-[var(--color-ink)] mb-2">
                Leadership & Governance
              </h3>
              <p className="text-sm text-[var(--color-muted)] leading-relaxed mb-4">
                Apply for open executive board positions, submit transparent fundraiser expense claims, and track double-entry finances.
              </p>
            </div>
            <Link
              to="/selection"
              className="text-sm font-semibold text-[var(--color-dusk)] hover:underline inline-flex items-center gap-1"
            >
              View Leadership Cycles &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Role Navigation Quick Access Panel */}
      <section className="py-10 bg-[var(--color-surface)] border-t border-[var(--color-line)] mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-[var(--color-ink)] text-sm">Need Help Finding Your Portal?</h4>
              <p className="text-xs text-[var(--color-muted)] mt-0.5">
                Volunteers, Leaders, and Faculty can jump straight to operational screens.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/volunteer" className="px-3 py-1.5 text-xs font-semibold rounded bg-[var(--color-paper)] border border-[var(--color-line)] text-[var(--color-ink)] hover:border-[var(--color-dusk)]">
                Volunteer Portal
              </Link>
              <Link to="/door/00000000-0000-0000-0000-000000000001" className="px-3 py-1.5 text-xs font-semibold rounded bg-[var(--color-paper)] border border-[var(--color-line)] text-[var(--color-ink)] hover:border-[var(--color-dusk)]">
                Door Scanner
              </Link>
              <Link to="/manage" className="px-3 py-1.5 text-xs font-semibold rounded bg-[var(--color-paper)] border border-[var(--color-line)] text-[var(--color-ink)] hover:border-[var(--color-dusk)]">
                Executive Manage Hub
              </Link>
              <Link to="/manage/finance/ledger" className="px-3 py-1.5 text-xs font-semibold rounded bg-[var(--color-paper)] border border-[var(--color-line)] text-[var(--color-ink)] hover:border-[var(--color-dusk)]">
                Treasurer Ledger
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
