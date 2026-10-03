import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, CalendarClock, UsersRound } from "lucide-react";
import { ContentState } from "@/components/common/ContentState";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function SelectionHub() {
  usePageTitle("Leadership opportunities");
  const { data: cyclesData, isPending, isError, refetch } = useQuery({
    queryKey: ['selection', 'cycles'],
    queryFn: async () => {
      // API endpoint: GET /selection/cycles
      const res = await fetch("/api/v1/selection/cycles");
      if (!res.ok) throw new Error("Failed to fetch selection cycles");
      return res.json();
    }
  });

  const { data: authData } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const res = await fetch("/api/v1/auth/me", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
  });

  const user = authData?.data;
  const isPresidentOrMentor = user?.roles?.includes('PRESIDENT') || user?.roles?.includes('MENTOR');

  const cycles = cyclesData?.data || [];
  const openCycles = cycles.filter(c => c.status === 'OPEN' && new Date(c.deadlineAt) > new Date());
  const closedCycles = cycles.filter(c => c.status === 'CLOSED' || new Date(c.deadlineAt) <= new Date());

  return (
    <div className="page-container py-12 sm:py-16">
      <div className="mb-8 max-w-2xl">
        <p className="mb-3 text-sm font-medium text-primary">Shape what comes next</p>
        <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">Bring your ideas. Build your community.</h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          Find open Skyline roles, understand the commitment, and apply when the fit feels right.
        </p>
      </div>

      {isPresidentOrMentor && (
        <div className="mb-10 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">
          <p className="font-semibold">Supervisory Role Notice</p>
          <p className="mt-1 text-xs text-amber-800">
            As a sitting President or Faculty Mentor, you supervise the governance selection cycle. To avoid conflicts of interest, applications are restricted for your role.
          </p>
        </div>
      )}

      <div className="space-y-12">
        {isPending ? (
          <div className="space-y-5" role="status" aria-label="Loading leadership opportunities">
            <Skeleton className="h-52 w-full rounded-2xl" />
            <Skeleton className="h-52 w-full rounded-2xl" />
          </div>
        ) : isError ? (
          <ContentState error title="Opportunities are taking a little longer." description="We couldn’t load the current selection cycles." action={refetch} />
        ) : openCycles.length === 0 ? (
          <ContentState title="No applications are open right now." description="New leadership opportunities will appear here when the next selection cycle begins." />
        ) : (
          openCycles.map(cycle => (
            <section key={cycle.id} className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="flex flex-col gap-5 border-b border-border bg-secondary/50 p-6 sm:p-8 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-3">
                    <h2 className="font-display text-2xl font-semibold tracking-tight">{cycle.name}</h2>
                    <span className="rounded-full bg-[#e4eee8] px-2.5 py-1 text-xs font-medium text-[#345d4a]">Applications open</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Term: {cycle.termStart} to {cycle.termEnd}</p>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
                  <CalendarClock className="size-5 text-primary" aria-hidden="true" />
                  <div><p className="text-xs text-muted-foreground">Apply by</p><p className="text-sm font-semibold">
                    {new Date(cycle.deadlineAt).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' })}
                  </p></div>
                </div>
              </div>

              <div className="p-6 sm:p-8">
                <h3 className="mb-6 text-sm font-medium text-muted-foreground">{cycle.posts?.length || 0} open position{cycle.posts?.length === 1 ? "" : "s"}</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {cycle.posts?.map(post => (
                    <div key={post.id} className="flex h-full flex-col rounded-xl border border-border p-5 transition hover:border-primary/40">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-display text-lg font-semibold">{post.title}</h4>
                        <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground"><UsersRound className="size-3" aria-hidden="true" />{post.capacity}</span>
                      </div>
                      <p className="mb-6 flex-1 text-sm leading-6 text-muted-foreground">{post.description}</p>
                      {isPresidentOrMentor ? (
                        <button
                          type="button"
                          disabled
                          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-muted px-4 text-xs font-medium text-muted-foreground cursor-not-allowed"
                        >
                          Ineligible (Supervisory role)
                        </button>
                      ) : (
                        <Link
                          to={`/selection/posts/${post.id}/apply`}
                          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                        >
                          Apply now <ArrowUpRight className="size-4" aria-hidden="true" />
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ))
        )}

        {closedCycles.length > 0 && (
          <div className="pt-8">
            <h3 className="mb-6 font-display text-2xl font-semibold">Past cycles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {closedCycles.map(cycle => (
                <div key={cycle.id} className="rounded-xl border border-border bg-card p-4">
                  <h4 className="font-semibold">{cycle.name}</h4>
                  <p className="mt-1 text-xs text-muted-foreground">Closed {new Date(cycle.deadlineAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
