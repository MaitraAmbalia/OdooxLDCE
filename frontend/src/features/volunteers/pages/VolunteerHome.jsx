import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Clock, MapPin, ReceiptIndianRupee, ShoppingBag, Ticket, Radio } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ContentState } from "@/components/common/ContentState";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useSession } from "@/hooks/useSession";
import { getSocket } from "@/lib/socket";

export default function VolunteerHome() {
  usePageTitle("Volunteer space");
  const { data: sessionData } = useSession();
  const user = sessionData?.data;

  const { data: tasksData, isPending: tasksLoading, isError: tasksError, refetch: refetchTasks } = useQuery({
    queryKey: ['tasks', 'me'],
    queryFn: async () => {
      // API endpoint: GET /tasks/me
      const res = await fetch("/api/v1/tasks/me", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    }
  });

  const { data: claimsData, isPending: claimsLoading, isError: claimsError, refetch: refetchClaims } = useQuery({
    queryKey: ['claims', 'me'],
    queryFn: async () => {
      // API endpoint: GET /claims/me
      const res = await fetch("/api/v1/claims/me", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch claims");
      return res.json();
    }
  });

  // Real-time updates for claims decisions and task assignments
  useEffect(() => {
    const socket = getSocket();
    const userId = user?.id || user?.sub;
    if (userId) {
      socket.emit("join:user", userId);
    }

    const onClaimReviewed = (claim) => {
      refetchClaims();
      if (claim?.status === "APPROVED") {
        toast.success(`Expense claim approved!`, {
          description: `₹${(Number(claim.amountPaise || 0) / 100).toFixed(0)} for "${claim.description}" has been approved.`,
        });
      } else if (claim?.status === "REJECTED") {
        toast.error(`Expense claim rejected`, {
          description: claim.reason ? `Reason: ${claim.reason}` : `Your claim for "${claim.description}" was rejected.`,
        });
      }
    };

    const onClaimCreated = () => {
      refetchClaims();
    };

    const onTaskUpdated = () => {
      refetchTasks();
    };

    socket.on("claim:reviewed", onClaimReviewed);
    socket.on("claim:created", onClaimCreated);
    socket.on("task:status_updated", onTaskUpdated);

    return () => {
      socket.off("claim:reviewed", onClaimReviewed);
      socket.off("claim:created", onClaimCreated);
      socket.off("task:status_updated", onTaskUpdated);
    };
  }, [user, refetchClaims, refetchTasks]);

  const { data: eventsData } = useQuery({
    queryKey: ['events', 'published'],
    queryFn: async () => {
      // Public events list using PUBLISHED status to avoid 403 Forbidden for non-event-leads
      const res = await fetch("/api/v1/events?status=PUBLISHED&sort=startAt", { credentials: "include" });
      if (!res.ok) return { data: [] };
      return res.json();
    },
    retry: false,
  });

  const tasks = tasksData?.data || [];
  const claims = claimsData?.data || [];
  const allEvents = eventsData?.data || [];

  // Derive upcoming duties: active assignments for volunteer
  const upcomingDuties = tasks
    .filter(task => task.status !== 'DONE')
    .map(task => {
      const linkedEvent = task.project?.event || allEvents.find(e =>
        e.id === task.project?.eventId || e.title?.toLowerCase() === task.project?.name?.toLowerCase()
      );
      return { ...task, event: linkedEvent };
    })
    .sort((a, b) => {
      const dateA = a.event?.startAt || a.dueAt || a.dueDate || a.createdAt;
      const dateB = b.event?.startAt || b.dueAt || b.dueDate || b.createdAt;
      return new Date(dateA || 0) - new Date(dateB || 0);
    });

  return (
    <div className="page-container py-12 sm:py-16">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-sm font-medium text-primary">Make things happen</p>
          <h1 className="font-display text-4xl font-semibold tracking-tight">Volunteer space</h1>
          <p className="mt-2 text-sm text-muted-foreground">Keep up with your tasks, duties, and expense claims.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm font-semibold">
            <Link to="/me/tickets">
              <Ticket className="size-4" /> My event passes
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-border bg-card text-foreground hover:bg-secondary/70 font-medium">
            <Link to="/shop">
              <ShoppingBag className="size-4" /> Shop
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-border bg-card text-foreground hover:bg-secondary/70 font-medium">
            <Link to="/volunteer/claims/new">
              <ReceiptIndianRupee className="size-4" /> Submit a claim
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Tasks */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-semibold">My active tasks</h2>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            {tasksLoading ? (
              <div className="space-y-3 p-6" role="status" aria-label="Loading tasks"><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
            ) : tasksError ? (
              <div className="p-5"><ContentState error title="Tasks aren't available." description="Try loading your assignments again." action={refetchTasks} /></div>
            ) : tasks.length === 0 ? (
              <div className="p-5"><ContentState title="No active tasks." description="New volunteer assignments will appear here." /></div>
            ) : (
              <ul className="divide-y divide-[var(--color-line)]">
                {tasks.map(task => (
                  <li key={task.id}>
                    <Link to={`/volunteer/tasks/${task.id}`} className="block p-6 transition-colors hover:bg-secondary/30">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold">{task.title}</h3>
                        <span className={`px-2 py-1 text-xs font-bold uppercase rounded ${
                          task.status === 'DONE' ? 'bg-[var(--color-ok)] text-white' :
                          task.status === 'BLOCKED' ? 'bg-[var(--color-stop)] text-white' :
                          task.status === 'IN_PROGRESS' ? 'bg-[var(--color-info)] text-white' :
                          'bg-[var(--color-neutral)] text-white'
                        }`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="mb-4 text-sm text-muted-foreground">{task.project?.name || "General event task"}</p>

                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <CalendarDays className="size-4" /> Due {task.dueDate || task.dueAt ? new Date(task.dueDate || task.dueAt).toLocaleDateString() : 'anytime'}
                        </span>
                        <span className="font-medium text-primary">Open task &rarr;</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right Column: Duties & Claims */}
        <div className="space-y-8">

          <section>
            <h2 className="mb-4 font-display text-xl font-semibold">Upcoming duties</h2>
            {upcomingDuties.length > 0 ? (
              <div className="space-y-3">
                {upcomingDuties.slice(0, 5).map(duty => (
                  <Link
                    key={duty.id}
                    to={`/volunteer/tasks/${duty.id}`}
                    className="block rounded-xl border border-border bg-card p-4 transition hover:border-primary/30 hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-sm font-semibold leading-snug">{duty.title}</h3>
                      <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary">
                        {duty.status.replace('_', ' ')}
                      </span>
                    </div>
                    {duty.event && (
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <CalendarDays className="size-3" />
                          <span>{new Date(duty.event.startAt || duty.event.startDate).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                        </div>
                        {duty.event.venue && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="size-3" />
                            <span className="truncate">{duty.event.venue}</span>
                          </div>
                        )}
                      </div>
                    )}
                    {!duty.event && (duty.dueDate || duty.dueAt) && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="size-3" />
                        <span>Due {new Date(duty.dueDate || duty.dueAt).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-secondary/30 p-6 text-center">
                <p className="text-sm text-muted-foreground">No door or cash-desk duties in the next 7 days.</p>
              </div>
            )}
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">My claims</h2>
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                Live sync
              </span>
            </div>
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              {claimsLoading ? (
                <div className="p-4"><Skeleton className="h-20" /></div>
              ) : claimsError ? (
                <div className="p-4 text-center text-sm text-destructive"><button onClick={() => refetchClaims()} className="font-medium hover:underline">Retry claims</button></div>
              ) : claims.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">No recent claims.</div>
              ) : (
                <ul className="divide-y divide-[var(--color-line)]">
                  {claims.map(claim => (
                    <li key={claim.id} className="p-4 hover:bg-[var(--color-paper)]">
                      <Link to={`/volunteer/claims/${claim.id}`} className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-[var(--color-ink)]">{claim.description}</p>
                          <p className="text-xs text-muted-foreground font-medium mt-1">{claim.createdAt ? new Date(claim.createdAt).toLocaleDateString() : ''}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-mono font-bold">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(claim.amountPaise / 100)}</p>
                          <p className={`text-[10px] uppercase font-bold tracking-wider mt-1 ${
                            claim.status === 'PAID' || claim.status === 'APPROVED' ? 'text-[var(--color-ok)]' :
                            claim.status === 'REJECTED' ? 'text-[var(--color-stop)]' : 'text-[var(--color-wait)]'
                          }`}>{claim.status.replace('_', ' ')}</p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
