import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  CalendarDays,
  HeartHandshake,
  LayoutDashboard,
  ShieldCheck,
  ShoppingBag,
  Ticket,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function AccountHome() {
  usePageTitle("My account");
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

  const { data: ordersData } = useQuery({
    queryKey: ['orders', 'me'],
    queryFn: async () => {
      const res = await fetch("/api/v1/orders/me", { credentials: "include" });
      if (!res.ok) return { data: [] };
      return res.json();
    },
    retry: false,
  });

  const user = authData?.data;
  const roles = user?.roles || [];
  const isLeadership = Boolean(
    roles.some((r) =>
      [
        "PRESIDENT",
        "TREASURER",
        "EVENT_HEAD",
        "VOLUNTEER_HEAD",
        "MARKETING_HEAD",
        "SPONSORSHIP_HEAD",
        "MENTOR",
      ].includes(r)
    )
  );
  const isVolunteer = Boolean(user?.isVolunteer || roles.includes("VOLUNTEER"));
  const tickets = ticketsData?.data || [];
  const nextTicket = tickets[0];
  const orders = ordersData?.data || [];
  const activeOrdersCount = orders.filter(o => o.status === 'PAID' || o.status === 'READY' || o.status === 'PENDING_PAYMENT').length;

  if (authLoading) return <div className="page-container max-w-5xl py-12" role="status" aria-label="Loading account"><Skeleton className="h-10 w-72" /><Skeleton className="mt-8 h-44 w-full rounded-2xl" /></div>;

  return (
    <div className="page-container max-w-5xl py-12 sm:py-16">
      {/* Welcome Banner */}
      <div className="mb-8 flex flex-col gap-4 border-b border-border pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-medium text-primary">Your Skyline</p>
          <h1 className="font-display text-4xl font-semibold tracking-tight">
            Welcome back, {user?.name || "Student"}.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Student ID: {user?.studentId || "23BCE301"} • {roles.length ? roles.join(', ') : 'Student Member'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/me/membership"
            className="inline-flex min-h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Membership card <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </div>

      {/* Executive Management Workspace Banner for Leaders */}
      {isLeadership && (
        <div className="mb-8 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3.5">
              <div className="rounded-xl bg-primary/15 p-2.5 text-primary">
                <ShieldCheck className="size-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">Executive Workspace</span>
                  <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    {roles.filter(r => ['PRESIDENT', 'TREASURER', 'EVENT_HEAD', 'VOLUNTEER_HEAD', 'MARKETING_HEAD', 'SPONSORSHIP_HEAD', 'MENTOR'].includes(r)).join(' • ')}
                  </span>
                </div>
                <h2 className="mt-1 text-lg font-bold text-foreground">Skyline LDCE Management Console</h2>
                <p className="text-xs text-muted-foreground">
                  You have executive operational authority. Oversee event pipelines, budgets, claims, and approvals.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
              <Link
                to="/manage"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
              >
                <LayoutDashboard className="size-3.5" /> Open Console
              </Link>
              {roles.includes('EVENT_HEAD') && (
                <Link
                  to="/manage/events/new"
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground hover:bg-muted"
                >
                  Propose Event
                </Link>
              )}
              {roles.includes('TREASURER') && (
                <Link
                  to="/manage/claims"
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground hover:bg-muted"
                >
                  Claims Queue
                </Link>
              )}
              {roles.includes('SPONSORSHIP_HEAD') && (
                <Link
                  to="/manage/sponsorship"
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground hover:bg-muted"
                >
                  Sponsorship CRM
                </Link>
              )}
              {roles.includes('MENTOR') && (
                <Link
                  to="/manage/budget"
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground hover:bg-muted"
                >
                  Budgets & Limits
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grid of Key Account Tiles */}
      <div className="mb-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">

        {/* Membership Tile */}
        <Link to="/me/membership" className="block rounded-2xl border border-border bg-card p-6 transition hover:border-primary/30 hover:shadow-md">
          <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Membership</p>
          {user?.membership?.status === 'ACTIVE' ? (
            <div>
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-[#47725e]"></span>
                <span className="text-lg font-semibold">Active member</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {user.membership.expiresAt ? `Valid until ${new Date(user.membership.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : 'Full access unlocked'}
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-muted-foreground"></span>
                <span className="text-lg font-semibold">Not active</span>
              </div>
              <p className="mt-2 text-xs font-medium text-primary">Explore membership &rarr;</p>
            </div>
          )}
        </Link>

        {/* Tickets Tile – Primary action (blue): volunteers need fast access to event QR codes */}
        <Link to="/me/tickets" className="block rounded-2xl bg-primary p-6 text-primary-foreground transition hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20">
          <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary-foreground/80"><Ticket className="size-3.5" /> My event passes</p>
          {nextTicket ? (
            <div>
              <p className="line-clamp-2 font-bold leading-snug" title={nextTicket.event?.title || "Event"}>
                {nextTicket.event?.title}
              </p>
              <p className="text-xs text-primary-foreground/75 mt-2">
                {nextTicket.event?.startAt ? new Date(nextTicket.event.startAt).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }) : "Pass ready"} · Open pass &rarr;
              </p>
            </div>
          ) : (
            <div>
              <p className="font-bold text-lg">No passes yet</p>
              <p className="text-xs text-primary-foreground/80 mt-2 font-medium">Browse events &rarr;</p>
            </div>
          )}
        </Link>

        {/* Orders Tile – Secondary action (white/outline): browse-oriented, lower urgency */}
        <Link to="/shop" className="block rounded-2xl border border-border bg-card p-6 transition hover:border-primary/30 hover:shadow-md">
          <p className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground"><ShoppingBag className="size-3.5" /> Shop</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-display font-bold text-foreground leading-none">{activeOrdersCount}</span>
            <span className="text-xs text-muted-foreground mb-1">active orders</span>
          </div>
          <p className="text-xs text-primary mt-2 font-medium">Browse merch &rarr;</p>
        </Link>

        {/* Volunteer/Tasks Tile */}
        {!roles.includes("MENTOR") && (
          <Link to="/volunteer" className="block rounded-2xl border border-border bg-card p-6 transition hover:border-primary/30 hover:shadow-md">
            <p className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground"><HeartHandshake className="size-3.5" /> Volunteering</p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-display font-bold text-foreground leading-none">
                {isVolunteer ? 'Active' : 'Join in'}
              </span>
            </div>
            <p className="text-xs text-primary mt-2 font-medium">{isVolunteer ? "Tasks, duties and claims" : "Help run events"} &rarr;</p>
          </Link>
        )}
      </div>

      {/* Quick Action Navigation Links */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link to="/events" className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition hover:border-primary/30">
          <div>
            <div className="font-bold text-sm text-foreground">Upcoming Events</div>
            <div className="text-xs text-muted-foreground">Register with member discount</div>
          </div>
          <CalendarDays className="size-5 text-primary" />
        </Link>

        {isLeadership ? (
          <Link to="/manage" className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition hover:border-primary/30">
            <div>
              <div className="font-bold text-sm text-foreground">Management Console</div>
              <div className="text-xs text-muted-foreground">Administer events, budgets & audits</div>
            </div>
            <LayoutDashboard className="size-5 text-primary" />
          </Link>
        ) : isVolunteer ? (
          <Link to="/volunteer" className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition hover:border-primary/30">
            <div>
              <div className="font-bold text-sm text-foreground">Volunteer Space</div>
              <div className="text-xs text-muted-foreground">Door check-in, attendance & tasks</div>
            </div>
            <HeartHandshake className="size-5 text-primary" />
          </Link>
        ) : (
          <Link to="/selection" className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition hover:border-primary/30">
            <div>
              <div className="font-bold text-sm text-foreground">Leadership Applications</div>
              <div className="text-xs text-muted-foreground">Apply for executive roles</div>
            </div>
            <ArrowUpRight className="size-5 text-primary" />
          </Link>
        )}

        <Link to="/announcements" className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition hover:border-primary/30">
          <div>
            <div className="font-bold text-sm text-foreground">Campus News & Feeds</div>
            <div className="text-xs text-muted-foreground">Official organization notices</div>
          </div>
          <ArrowUpRight className="size-5 text-primary" />
        </Link>
      </div>
    </div>
  );
}
