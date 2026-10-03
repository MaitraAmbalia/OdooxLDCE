import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BarChart3, CalendarDays, Pencil, Plus, ScanLine, CalendarPlus as CalendarPlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContentState } from "@/components/common/ContentState";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useSession } from "@/hooks/useSession";
import { getJson } from "@/lib/api";
import { formatINR } from "@/lib/utils";
import { StatusBadge } from "@/components/common/StatusBadge";

const EDITABLE = ["DRAFT", "PENDING_APPROVAL", "CHANGES_REQUESTED"];

export default function EventConsole() {
  usePageTitle("Event console");
  const { data: session } = useSession();
  const permissions = session?.data?.permissions || [];
  const { data, isPending, isError, refetch } = useQuery({ queryKey: ["events", "manage"], queryFn: () => getJson("/events/manage") });
  const events = data?.data || [];
  // Month groups: upcoming months soonest first, then past months most recent first.
  const now = Date.now();
  const byMonth = Object.entries([...events].sort((a, b) => new Date(a.startAt) - new Date(b.startAt)).reduce((g, e) => {
    const key = new Date(e.startAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    (g[key] ??= []).push(e);
    return g;
  }, {}));
  const isPastGroup = ([, list]) => list.every((e) => new Date(e.endAt) < now);
  const groups = [...byMonth.filter((g) => !isPastGroup(g)), ...byMonth.filter(isPastGroup).reverse()];

  return (
    <div className="page-container py-12 sm:py-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="mb-2 text-sm font-medium text-primary">Event operations</p><h1 className="font-display text-4xl font-semibold tracking-tight">Event console</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Track proposals through mentor review, adjust live events, staff the door, and compare tickets sold with check-ins.</p></div>
        {permissions.includes("event.propose") && <Button asChild><Link to="/manage/events/new"><Plus aria-hidden="true" /> Propose event</Link></Button>}
      </div>

      <div className="mt-8">
        {isPending ? <div className="space-y-3" role="status" aria-label="Loading events"><Skeleton className="h-28 rounded-2xl" /><Skeleton className="h-28 rounded-2xl" /></div>
          : isError ? <ContentState error title="Events aren’t available right now." description="We couldn’t load the event console." action={refetch} />
          : events.length === 0 ? <ContentState icon={CalendarPlusIcon} to="/manage/events/new" actionLabel="Propose an event" title="No events yet." description="Proposals you submit appear here while they wait for mentor review." />
          : <div className="space-y-8">{groups.map(([month, list]) => (
            <section key={month} aria-label={month}>
            <h2 className="sticky top-16 z-10 -mx-1 mb-3 bg-background/95 px-1 py-2 text-sm font-semibold text-muted-foreground backdrop-blur">{month}{list.every((e) => new Date(e.endAt) < now) && " · past"}</h2>
            <ul className="space-y-3">{list.map((event) => {
            const sold = event.ticketTypes.reduce((n, t) => n + t.sold, 0);
            // Live events change capacity from their report page; pricing is locked once the Mentor approved it.
            const canEdit = EDITABLE.includes(event.status);
            return (
              <li key={event.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><StatusBadge status={event.status} /><span className="text-xs text-muted-foreground">by {event.proposedBy?.name}</span></div>
                    <h2 className="mt-2 font-display text-xl font-semibold">{event.title}</h2>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><CalendarDays className="size-4" aria-hidden="true" />{new Date(event.startAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })} · {event.venue}</p>
                    <p className="mt-2 text-sm">{sold} / {event.capacity} sold · {event.checkedIn} checked in · {event.approvedBudgetPaise != null ? `Budget ${formatINR(event.approvedBudgetPaise, true)} approved` : event.requestedBudgetPaise ? `Budget ${formatINR(event.requestedBudgetPaise, true)} requested` : "No budget"}</p>
                    {event.latestReview?.comment && ["CHANGES_REQUESTED", "REJECTED"].includes(event.status) && <p className="mt-2 rounded-lg bg-warning-soft p-2 text-sm text-warning">Mentor: {event.latestReview.comment}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {canEdit && permissions.includes("event.propose") && <Button asChild variant="outline" size="sm"><Link to={`/manage/events/${event.id}/edit`}><Pencil aria-hidden="true" /> {event.status === "CHANGES_REQUESTED" ? "Revise & resubmit" : "Edit"}</Link></Button>}
                    {permissions.includes("event.approve") && ["PENDING_APPROVAL", "CHANGES_REQUESTED"].includes(event.status) && <Button asChild size="sm"><Link to={`/manage/events/${event.id}/review`}>Review <ArrowRight aria-hidden="true" /></Link></Button>}
                    {event.status === "PUBLISHED" && permissions.includes("ticket.checkin") && <Button asChild variant="outline" size="sm"><Link to={`/door/${event.id}`}><ScanLine aria-hidden="true" /> Door</Link></Button>}
                    {permissions.includes("event.report.read") && ["PUBLISHED", "CLOSED"].includes(event.status) && <Button asChild variant="outline" size="sm"><Link to={`/manage/events/${event.id}/report`}><BarChart3 aria-hidden="true" /> Report</Link></Button>}
                  </div>
                </div>
              </li>
            );
          })}</ul>
            </section>
          ))}</div>}
      </div>
    </div>
  );
}
