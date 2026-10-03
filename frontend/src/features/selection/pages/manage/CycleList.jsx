import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Settings2, Users } from "lucide-react";
import { ContentState } from "@/components/common/ContentState";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function CycleList() {
  usePageTitle("Manage selection cycles");
  const { data: cyclesData, isPending, isError, refetch } = useQuery({
    queryKey: ['selection', 'cycles'],
    queryFn: async () => {
      const res = await fetch("/api/v1/selection/cycles");
      if (!res.ok) throw new Error("Failed to fetch selection cycles");
      return res.json();
    }
  });

  const cycles = cyclesData?.data || [];

  return (
    <div className="page-container py-12 sm:py-16">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-sm font-medium text-primary">Leadership workspace</p>
          <h1 className="font-display text-4xl font-semibold tracking-tight">Selection cycles</h1>
          <p className="mt-2 text-sm text-muted-foreground">Manage ongoing recruitment and review incoming leadership applications.</p>
        </div>
        <Link
          to="/manage/selection/new/edit"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Create cycle
        </Link>
      </div>

      {isPending ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      ) : isError ? (
        <ContentState error title="Couldn't load cycles." description="Please check your connection and try again." action={refetch} />
      ) : cycles.length === 0 ? (
        <ContentState title="No selection cycles found." description="Create a new cycle to start recruiting leaders." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {cycles.map(cycle => (
            <div key={cycle.id} className="rounded-2xl border border-border bg-card p-6 flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-display text-xl font-semibold">{cycle.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">Status: <strong className="text-foreground">{cycle.status}</strong></p>
                </div>
                <span className="rounded-full bg-secondary/50 px-2.5 py-1 text-xs font-medium text-primary">
                  {cycle.posts?.length || 0} Posts
                </span>
              </div>
              <div className="mt-auto grid grid-cols-2 gap-3 pt-6">
                <Link
                  to={`/manage/selection/${cycle.id}/edit`}
                  className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card py-2 text-sm font-medium hover:bg-secondary/30"
                >
                  <Settings2 className="size-4" /> Edit
                </Link>
                <Link
                  to={`/manage/selection/${cycle.id}/applications`}
                  className="flex items-center justify-center gap-2 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <Users className="size-4" /> Review
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
