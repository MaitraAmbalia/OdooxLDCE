import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  CreditCard, Ticket, Package, HandHelping, Calendar, Award, Megaphone,
  ArrowRight, LogIn,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Skeleton } from "../../../components/ui/skeleton";

function Tile({ to, icon: Icon, label, tone, children, cta }) {
  return (
    <Link
      to={to}
      className="group flex flex-col bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${tone}`}>
          <Icon className="w-4.5 h-4.5" aria-hidden="true" />
        </span>
      </div>
      <div className="flex-1">{children}</div>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-700">
        {cta} <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
      </span>
    </Link>
  );
}

const QUICK_LINKS = [
  { to: "/events", icon: Calendar, title: "Upcoming events", desc: "Register with member pricing" },
  { to: "/selection", icon: Award, title: "Leadership applications", desc: "Apply for executive roles" },
  { to: "/announcements", icon: Megaphone, title: "News & announcements", desc: "Official organization notices" },
];

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

  const user = authData?.data;

  const { data: ticketsData } = useQuery({
    queryKey: ['tickets', 'me'],
    queryFn: async () => {
      const res = await fetch("/api/v1/tickets/me", { credentials: "include" });
      if (!res.ok) return { data: [] };
      return res.json();
    },
    enabled: !!user,
    retry: false,
  });

  const { data: ordersData } = useQuery({
    queryKey: ['orders', 'me'],
    queryFn: async () => {
      const res = await fetch("/api/v1/orders/me", { credentials: "include" });
      if (!res.ok) return { data: [] };
      return res.json();
    },
    enabled: !!user,
    retry: false,
  });

  if (authLoading) {
    return (
      <div className="max-w-5xl w-full mx-auto px-4 py-10 sm:px-6 lg:px-8 space-y-6" aria-busy="true">
        <Skeleton className="h-10 w-72 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-24">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-5">
            <LogIn className="w-7 h-7" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-display font-extrabold text-slate-900">Sign in to your hub</h1>
          <p className="mt-2 text-slate-600">See your membership, tickets and orders in one place.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/login"><Button>Log in</Button></Link>
            <Link to="/join"><Button variant="outline">Become a member</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  const tickets = ticketsData?.data || [];
  const orders = ordersData?.data || [];
  const activeOrders = orders.filter(o => o.status !== "COLLECTED" && o.status !== "CANCELLED").length;
  const nextTicket = tickets[0];
  const nextTicketDate = nextTicket?.event?.startAt || nextTicket?.event?.startDate;
  const isMember = user.membership?.status === 'ACTIVE';

  return (
    <div className="max-w-5xl w-full mx-auto px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 pb-6 border-b border-slate-200">
        <div>
          <p className="text-sm font-medium text-slate-500">Welcome back</p>
          <h1 className="text-3xl font-display font-extrabold text-slate-900">{user.name}</h1>
          {(user.studentId || user.roles?.length > 0) && (
            <p className="text-sm font-mono text-slate-500 mt-1">
              {[user.studentId, user.roles?.map(r => r.replace(/_/g, " ")).join(", ")].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        <Link to="/me/membership">
          <Button><CreditCard className="w-4 h-4" aria-hidden="true" /> Membership card</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <Tile to={isMember ? "/me/membership" : "/join"} icon={CreditCard} label="Membership" tone="bg-blue-50 text-blue-600" cta={isMember ? "View card" : "Join now"}>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isMember ? "bg-emerald-500" : "bg-slate-300"}`} aria-hidden="true" />
            <span className="font-bold text-slate-900 text-lg">{isMember ? "Active" : "Not a member"}</span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {isMember
              ? (user.membership.expiresAt ? `Valid until ${new Date(user.membership.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : "Full access unlocked")
              : "Unlock member pricing"}
          </p>
        </Tile>

        <Tile to="/me/tickets" icon={Ticket} label="Tickets" tone="bg-violet-50 text-violet-600" cta={nextTicket ? "Open passes" : "Browse events"}>
          {nextTicket ? (
            <>
              <p className="font-bold text-slate-900 truncate" title={nextTicket.event?.title}>{nextTicket.event?.title || "Upcoming event"}</p>
              <p className="text-sm text-slate-500 mt-1">
                {nextTicketDate ? new Date(nextTicketDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : "Pass ready"}
                {tickets.length > 1 && ` · +${tickets.length - 1} more`}
              </p>
            </>
          ) : (
            <>
              <p className="font-bold text-slate-900 text-lg">No tickets yet</p>
              <p className="text-sm text-slate-500 mt-1">Your passes will appear here</p>
            </>
          )}
        </Tile>

        <Tile to="/me/orders" icon={Package} label="Orders" tone="bg-amber-50 text-amber-600" cta={orders.length ? "Track orders" : "Visit shop"}>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-display font-bold text-slate-900 leading-none">{activeOrders}</span>
            <span className="text-sm text-slate-500">in progress</span>
          </div>
          <p className="text-sm text-slate-500 mt-1">{orders.length} total</p>
        </Tile>

        <Tile to="/volunteer" icon={HandHelping} label="Volunteering" tone="bg-emerald-50 text-emerald-600" cta="Open portal">
          <p className="font-bold text-slate-900 text-lg">{user.isVolunteer ? "Active volunteer" : "Get involved"}</p>
          <p className="text-sm text-slate-500 mt-1">{user.isVolunteer ? "See your tasks & shifts" : "Help run campus events"}</p>
        </Tile>
      </div>

      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">Explore</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {QUICK_LINKS.map(({ to, icon: Icon, title, desc }) => (
          <Link key={to} to={to} className="group p-4 bg-white border border-slate-200/80 rounded-xl hover:border-slate-300 hover:shadow-sm transition-all flex items-center gap-3">
            <span className="w-10 h-10 shrink-0 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <Icon className="w-5 h-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm text-slate-900">{title}</div>
              <div className="text-xs text-slate-500">{desc}</div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </div>
  );
}
