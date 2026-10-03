import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Banknote, CalendarDays, ClipboardCheck, HandCoins, Megaphone, PackageCheck, Plus, ReceiptIndianRupee, UsersRound, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContentState } from "@/components/common/ContentState";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";

const MODULES = [
  { title: "Events", description: "Proposals, reviews, and public programming.", icon: CalendarDays, links: [{ label: "Propose an event", to: "/manage/events/new" }, { label: "Browse events", to: "/events" }] },
  { title: "Sponsorship", description: "Send approved event opportunities to Odoo CRM and reconcile received funds.", icon: HandCoins, links: [{ label: "Open sponsorship workspace", to: "/manage/sponsorship" }] },
  { title: "Finance", description: "Claims, cash, budgets, and reporting.", icon: Banknote, links: [{ label: "Expense claims", to: "/manage/claims" }, { label: "Cash verification", to: "/manage/cash" }, { label: "General ledger", to: "/manage/finance/ledger" }, { label: "Financial reports", to: "/manage/finance/reports" }, { label: "Budget allocations", to: "/manage/budget" }] },
  { title: "Projects", description: "Task boards and volunteer delivery.", icon: UsersRound, links: [{ label: "Project portfolio", to: "/manage/projects" }, { label: "Volunteer workspace", to: "/volunteer" }] },
  { title: "Communications", description: "Announcements and publishing history.", icon: Megaphone, links: [{ label: "New announcement", to: "/manage/announcements/new" }, { label: "Communications history", to: "/manage/newsletter" }] },
  { title: "Meetings", description: "Schedules, agendas, and invite responses.", icon: ClipboardCheck, links: [{ label: "Meeting schedule", to: "/manage/meetings" }, { label: "Schedule a meeting", to: "/manage/meetings/new" }] },
  { title: "Store", description: "Pack and hand over merchandise orders.", icon: PackageCheck, links: [{ label: "Order fulfilment", to: "/manage/orders" }, { label: "View shop", to: "/shop" }] },
  { title: "Leadership Selection", description: "Recruit executives and heads.", icon: ShieldCheck, links: [{ label: "Create selection cycle", to: "/manage/selection/new/edit" }, { label: "Manage current cycles", to: "/manage/selection/cycles" }] },
];

export default function ManageHome() {
  usePageTitle("Manage");
  const { data: authData } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const response = await fetch("/api/v1/auth/me", { credentials: "include" });
      if (!response.ok) return null;
      return response.json();
    },
    retry: false,
  });

  const { data: countsData, isPending, isError, refetch } = useQuery({
    queryKey: ["dashboard", "counts"],
    queryFn: async () => {
      const response = await fetch("/api/v1/dashboard/counts", { credentials: "include" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error?.message || "Failed to load management counts");
      return json;
    },
  });

  const { data: proposalsData } = useQuery({
    queryKey: ["events", { status: "PENDING_APPROVAL", limit: 5 }],
    queryFn: async () => {
      const response = await fetch("/api/v1/events?status=PENDING_APPROVAL&limit=5", { credentials: "include" });
      if (!response.ok) return { data: [] };
      return response.json();
    },
    retry: false,
  });

  const user = authData?.data;
  const counts = countsData?.data;
  const firstProposal = proposalsData?.data?.[0];

  const queues = counts ? [
    { title: "Expense claims", count: counts.claimsPending || 0, description: "Awaiting finance review", to: "/manage/claims", icon: ReceiptIndianRupee },
    { title: "Event proposals", count: counts.proposalsToReview || 0, description: "Awaiting mentor review", to: firstProposal ? "/manage/events/" + firstProposal.id + "/review" : null, icon: CalendarDays },
    { title: "Active tasks", count: counts.activeTasks || 0, description: "Across current projects", to: "/manage/projects", icon: UsersRound },
    { title: "Orders to pack", count: counts.ordersToPack || 0, description: "Paid merchandise orders", to: "/manage/orders", icon: PackageCheck },
  ] : [];

  return (
    <div className="page-container py-12 sm:py-16">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="mb-2 text-sm font-medium text-primary">Leadership workspace</p><h1 className="font-display text-4xl font-semibold tracking-tight">Manage Skyline</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{user?.name ? "Welcome back, " + user.name + ". " : ""}Review priority work and move between association operations.</p>{user?.roles?.length > 0 && <p className="mt-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">{user.roles.join(" · ").replaceAll("_", " ")}</p>}</div>
        <div className="flex flex-col gap-2 sm:flex-row"><Button asChild variant="outline"><Link to="/manage/meetings/new"><Plus aria-hidden="true" /> Meeting</Link></Button><Button asChild><Link to="/manage/events/new"><Plus aria-hidden="true" /> Propose event</Link></Button></div>
      </div>

      <section className="mt-10" aria-labelledby="priority-heading">
        <div className="mb-4"><h2 id="priority-heading" className="font-display text-2xl font-semibold">Priority queues</h2><p className="mt-1 text-sm text-muted-foreground">Live counts from the workflows that need attention.</p></div>
        {isPending ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" role="status" aria-label="Loading management queues"><Skeleton className="h-40 rounded-2xl" /><Skeleton className="h-40 rounded-2xl" /><Skeleton className="h-40 rounded-2xl" /><Skeleton className="h-40 rounded-2xl" /></div>
        ) : isError ? (
          <ContentState error title="Priority queues aren’t available." description="The workspace counts could not be loaded." action={refetch} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {queues.map((queue) => {
              const Icon = queue.icon;
              const content = <><div className="flex items-start justify-between"><span className="rounded-xl bg-primary/10 p-2 text-primary"><Icon className="size-5" aria-hidden="true" /></span>{queue.to && <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" aria-hidden="true" />}</div><p className="mt-6 font-display text-4xl font-semibold tabular-nums">{queue.count}</p><h3 className="mt-2 font-semibold">{queue.title}</h3><p className="mt-1 text-xs text-muted-foreground">{queue.description}</p>{!queue.to && queue.count > 0 && <p className="mt-3 text-xs text-amber-700">No review record is currently visible.</p>}</>;
              return queue.to ? <Link key={queue.title} to={queue.to} className="group rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{content}</Link> : <div key={queue.title} className="rounded-2xl border border-border bg-card p-5">{content}</div>;
            })}
          </div>
        )}
      </section>

      <section className="mt-12" aria-labelledby="workspaces-heading">
        <div className="mb-4"><h2 id="workspaces-heading" className="font-display text-2xl font-semibold">Workspaces</h2><p className="mt-1 text-sm text-muted-foreground">Choose an operational area to continue.</p></div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((module) => {
            const Icon = module.icon;
            return <article key={module.title} className="rounded-2xl border border-border bg-card p-5 sm:p-6"><span className="inline-flex rounded-xl bg-secondary p-2.5 text-primary"><Icon className="size-5" aria-hidden="true" /></span><h3 className="mt-5 font-display text-xl font-semibold">{module.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{module.description}</p><div className="mt-5 space-y-1">{module.links.map((link) => <Link key={link.to} to={link.to} className="group flex min-h-10 items-center justify-between rounded-lg px-3 text-sm font-medium transition hover:bg-secondary"><span>{link.label}</span><ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" aria-hidden="true" /></Link>)}</div></article>;
          })}
        </div>
      </section>
    </div>
  );
}
