import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Banknote, CalendarDays, ClipboardCheck, HandCoins, Megaphone, PackageCheck, Plus, ReceiptIndianRupee, UsersRound, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContentState } from "@/components/common/ContentState";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";
import { formatINR } from "@/lib/utils";

const ALL_MODULES = [
  {
    title: "Events",
    perms: ["event.propose", "event.approve", "event.report.read", "event.publish"],
    description: "Proposals, reviews, door staff, and post-event analytics.",
    icon: CalendarDays,
    links: [
      { label: "Event console", to: "/manage/events", anyPermission: ["event.propose", "event.approve", "event.report.read", "event.publish"] },
      { label: "Propose an event", to: "/manage/events/new", requiredPermission: "event.propose" },
      { label: "Browse events", to: "/events" },
    ],
  },
  {
    title: "Sponsorship",
    perms: ["sponsorship.crm.read", "sponsorship.crm.manage"],
    description: "Send approved event opportunities to Odoo CRM and reconcile received funds.",
    icon: HandCoins,
    links: [
      { label: "Open sponsorship workspace", to: "/manage/sponsorship", anyPermission: ["sponsorship.crm.read", "sponsorship.crm.manage"] },
    ],
  },
  {
    title: "Finance",
    perms: ["ledger.read", "claim.review", "claim.review.high", "claim.review.treasurer", "cash.verify", "budget.limit.manage", "budget.allocate", "finance.report.read", "member.read.any", "membership.tier.manage"],
    description: "Claims, cash, dues, budgets, and reporting.",
    icon: Banknote,
    links: [
      { label: "Expense claims", to: "/manage/claims", anyPermission: ["claim.review", "claim.review.high", "claim.review.treasurer", "claim.pay"] },
      { label: "Cash verification", to: "/manage/cash", requiredPermission: "cash.verify" },
      { label: "Membership dues", to: "/manage/memberships", anyPermission: ["member.read.any", "membership.tier.manage"] },
      { label: "Budget", to: "/manage/budget", anyPermission: ["budget.limit.manage", "budget.allocate"] },
      { label: "General ledger", to: "/manage/finance/ledger", requiredPermission: "ledger.read" },
      { label: "Reports & reconciliation", to: "/manage/finance/reports", requiredPermission: "finance.report.read" },
    ],
  },
  {
    title: "Projects",
    perms: ["project.manage", "volunteer.manage"],
    description: "Task boards and volunteer delivery.",
    icon: UsersRound,
    links: [
      { label: "Project portfolio", to: "/manage/projects", anyPermission: ["project.manage", "volunteer.manage"] },
      { label: "Add & assign task", to: "/manage/projects?action=new-task", anyPermission: ["project.manage", "volunteer.manage"] },
      { label: "Volunteer workspace", to: "/volunteer" },
    ],
  },
  {
    title: "Communications",
    perms: ["announcement.publish", "newsletter.send", "newsletter.stats.read"],
    description: "Announcements and publishing history.",
    icon: Megaphone,
    links: [
      { label: "New announcement", to: "/manage/announcements/new", requiredPermission: "announcement.publish" },
      { label: "Communications history", to: "/manage/newsletter", anyPermission: ["newsletter.send", "newsletter.stats.read"] },
    ],
  },
  {
    title: "Store",
    perms: ["order.fulfil", "merch.manage"],
    description: "Pack and hand over merchandise orders.",
    icon: PackageCheck,
    links: [
      { label: "Order fulfilment", to: "/manage/orders", requiredPermission: "order.fulfil" },
      { label: "View shop", to: "/shop" },
    ],
  },
  {
    title: "Leadership Selection",
    perms: ["selection.manage", "selection.review"],
    description: "Recruit executives and heads.",
    icon: ShieldCheck,
    links: [
      { label: "Create selection cycle", to: "/manage/selection/new/edit", requiredPermission: "selection.manage" },
      { label: "Manage current cycles", to: "/manage/selection/cycles", anyPermission: ["selection.manage", "selection.review"] },
    ],
  },
];

export default function ManageHome() {
  usePageTitle("Manage");
  const { data: authData, isPending: isAuthPending } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const response = await fetch("/api/v1/auth/me", { credentials: "include" });
      if (!response.ok) return null;
      return response.json();
    },
    retry: false,
  });

  const user = authData?.data;
  const userPermissions = user?.permissions || [];
  const can = (perms) => !perms || perms.some((p) => userPermissions.includes(p));

  const { data: countsData, isPending, isError, refetch } = useQuery({
    queryKey: ["dashboard", "counts"],
    enabled: Boolean(user),
    queryFn: async () => {
      const response = await fetch("/api/v1/dashboard/counts", { credentials: "include" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error?.message || "Failed to load management counts");
      return json;
    },
  });

  const { data: proposalsData } = useQuery({
    queryKey: ["events", { status: "PENDING_APPROVAL", limit: 5 }],
    enabled: Boolean(userPermissions.includes("event.approve")),
    queryFn: async () => {
      const response = await fetch("/api/v1/events?status=PENDING_APPROVAL&limit=5", { credentials: "include" });
      if (!response.ok) return { data: [] };
      return response.json();
    },
    retry: false,
  });

  const counts = countsData?.data;
  const firstProposal = proposalsData?.data?.[0];
  const isMentor = userPermissions.includes("event.approve");

  const queues = counts ? [
    { perms: ["claim.review", "claim.review.high", "claim.review.treasurer", "claim.pay"], title: "Expense claims", count: counts.claimsPending || 0, description: "Awaiting review or payout", to: "/manage/claims", icon: ReceiptIndianRupee },
    { perms: ["cash.verify"], title: "Cash to verify", count: counts.cashPending || 0, description: counts.cashPending ? `${formatINR(counts.cashPendingPaise, true)} awaiting handover` : "Nothing waiting", to: "/manage/cash", icon: Banknote },
    { perms: ["member.read.any"], title: "Unpaid dues", count: counts.duesPending || 0, description: "Signed up, not yet paid", to: "/manage/memberships", icon: UsersRound },
    isMentor
      ? { perms: ["event.approve"], title: "Event proposals", count: counts.proposalsToReview || 0, description: "Awaiting your review", to: firstProposal ? "/manage/events/" + firstProposal.id + "/review" : "/manage/events", icon: CalendarDays }
      : { perms: ["event.propose"], title: "My proposals", count: (counts.myProposalsPending || 0) + (counts.myProposalsChangesRequested || 0), description: counts.myProposalsChangesRequested ? `${counts.myProposalsChangesRequested} need your changes` : "Waiting for mentor review", to: "/manage/events", icon: CalendarDays },
    { perms: ["project.manage", "volunteer.manage"], title: "Active tasks", count: counts.activeTasks || 0, description: "Across current projects", to: "/manage/projects", icon: UsersRound },
    { perms: ["order.fulfil"], title: "Orders to pack", count: counts.ordersToPack || 0, description: "Paid merchandise orders", to: "/manage/orders", icon: PackageCheck },
    { perms: ["sponsorship.crm.read"], title: "Sponsorship CRM", count: "Odoo", description: "Pipeline & commitments", to: "/manage/sponsorship", icon: HandCoins },
  ].filter((q) => can(q.perms)) : [];

  if (!isAuthPending && !user) {
    return (
      <div className="page-container py-16">
        <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ShieldCheck className="size-6" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-semibold">Leadership sign in required</h1>
          <p className="mt-2 text-sm text-muted-foreground leading-6">
            The management workspace is reserved for Skyline student leaders and mentors. Please sign in to continue.
          </p>
          <Button asChild className="mt-6 w-full">
            <Link to="/login?redirect=/manage">Sign in to Skyline</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container py-12 sm:py-16">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-sm font-medium text-primary">Leadership workspace</p>
          <h1 className="font-display text-4xl font-semibold tracking-tight">Manage Skyline</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{user?.name ? "Welcome back, " + user.name + ". " : ""}Review priority work and move between association operations.</p>
          {user?.roles?.length > 0 && <p className="mt-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">{user.roles.join(" · ").replaceAll("_", " ")}</p>}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {can(["project.manage", "volunteer.manage"]) && (
            <Button asChild variant="outline">
              <Link to="/manage/projects?action=new-task"><Plus aria-hidden="true" /> Add task</Link>
            </Button>
          )}
          {can(["event.propose"]) && (
            <Button asChild>
              <Link to="/manage/events/new"><Plus aria-hidden="true" /> Propose event</Link>
            </Button>
          )}
          {can(["sponsorship.crm.manage"]) && !can(["event.propose"]) && (
            <Button asChild>
              <Link to="/manage/sponsorship"><HandCoins aria-hidden="true" /> Sponsorship CRM</Link>
            </Button>
          )}
        </div>
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
              const content = (
                <>
                  <div className="flex items-start justify-between">
                    <span className="rounded-xl bg-primary/10 p-2 text-primary">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    {queue.to && <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" aria-hidden="true" />}
                  </div>
                  <p className="mt-6 font-display text-4xl font-semibold tabular-nums">{queue.count}</p>
                  <h3 className="mt-2 font-semibold">{queue.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{queue.description}</p>
                  {!queue.to && queue.count > 0 && <p className="mt-3 text-xs text-warning">No review record is currently visible.</p>}
                </>
              );
              return queue.to ? (
                <Link key={queue.title} to={queue.to} className="group rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {content}
                </Link>
              ) : (
                <div key={queue.title} className="rounded-2xl border border-border bg-card p-5">
                  {content}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-12" aria-labelledby="workspaces-heading">
        <div className="mb-4"><h2 id="workspaces-heading" className="font-display text-2xl font-semibold">Workspaces</h2><p className="mt-1 text-sm text-muted-foreground">Choose an operational area to continue.</p></div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {ALL_MODULES.filter((module) => can(module.perms)).map((module) => {
            const Icon = module.icon;
            const visibleLinks = module.links.filter((l) => {
              if (l.requiredPermission && !userPermissions.includes(l.requiredPermission)) return false;
              if (l.anyPermission && !l.anyPermission.some((p) => userPermissions.includes(p))) return false;
              return true;
            });
            if (!visibleLinks.length) return null;
            return (
              <article key={module.title} className="rounded-2xl border border-border bg-card p-5 sm:p-6">
                <span className="inline-flex rounded-xl bg-secondary p-2.5 text-primary">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 font-display text-xl font-semibold">{module.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{module.description}</p>
                <div className="mt-5 space-y-1">
                  {visibleLinks.map((link) => (
                    <Link key={link.to} to={link.to} className="group flex min-h-10 items-center justify-between rounded-lg px-3 text-sm font-medium transition hover:bg-secondary">
                      <span>{link.label}</span>
                      <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    </Link>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
