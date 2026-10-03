import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, ReceiptIndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContentState } from "@/components/common/ContentState";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function VolunteerHome() {
  usePageTitle("Volunteer space");
  const { data: tasksData, isPending: tasksLoading, isError: tasksError, refetch: refetchTasks } = useQuery({
    queryKey: ['tasks', 'me'],
    queryFn: async () => {
      // API endpoint: GET /tasks/me
      const res = await fetch("/api/v1/tasks/me");
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    }
  });

  const { data: claimsData, isPending: claimsLoading, isError: claimsError, refetch: refetchClaims } = useQuery({
    queryKey: ['claims', 'me'],
    queryFn: async () => {
      // API endpoint: GET /claims/me
      const res = await fetch("/api/v1/claims/me");
      if (!res.ok) throw new Error("Failed to fetch claims");
      return res.json();
    }
  });

  const tasks = tasksData?.data || [];
  const claims = claimsData?.data || [];

  return (
    <div className="page-container py-12 sm:py-16">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-sm font-medium text-primary">Make things happen</p>
          <h1 className="font-display text-4xl font-semibold tracking-tight">Volunteer space</h1>
          <p className="mt-2 text-sm text-muted-foreground">Keep up with your tasks, duties, and expense claims.</p>
        </div>
        <Button asChild><Link to="/volunteer/claims/new"><ReceiptIndianRupee aria-hidden="true" /> Submit a claim</Link></Button>
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
              <div className="p-5"><ContentState error title="Tasks aren’t available." description="Try loading your assignments again." action={refetchTasks} /></div>
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
                          <CalendarDays className="size-4" /> Due {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'anytime'}
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

        {/* Right Column: Claims & Duties */}
        <div className="space-y-8">

          <section>
            <h2 className="mb-4 font-display text-xl font-semibold">Upcoming duties</h2>
            <div className="rounded-xl border border-border bg-secondary/30 p-6 text-center">
              <p className="text-sm text-muted-foreground">No door or cash-desk duties in the next 7 days.</p>
            </div>
          </section>

          <section>
            <h2 className="mb-4 font-display text-xl font-semibold">My claims</h2>
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
                          <p className="text-xs text-muted-foreground font-medium mt-1">{new Date(claim.createdAt).toLocaleDateString()}</p>
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
