import { useQuery } from "@tanstack/react-query";
import { ContentState } from "@/components/common/ContentState";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function Budget() {
  usePageTitle("Budgets");
  const { data: budgetData, isPending, isError, refetch } = useQuery({
    queryKey: ['finance', 'budget'],
    queryFn: async () => {
      // API endpoint: GET /finance/budget
      const res = await fetch("/api/v1/finance/budget", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch budget");
      return res.json();
    }
  });

  const budgets = budgetData?.data || [];

  const totalAllocated = budgets.reduce((acc, curr) => acc + curr.allocatedPaise, 0);
  const totalSpent = budgets.reduce((acc, curr) => acc + curr.spentPaise, 0);
  const totalUtilisation = totalAllocated ? (totalSpent / totalAllocated) * 100 : 0;

  return (
    <div className="page-container py-12 sm:py-16">
      <div className="mb-8">
        <p className="mb-2 text-sm font-medium text-primary">Finance</p>
        <h1 className="font-display text-4xl font-semibold tracking-tight">Budget allocations</h1>
        <p className="mt-2 text-sm text-muted-foreground">Track current spending against allocated limits.</p>
      </div>

      {isError ? <ContentState error title="Budgets aren’t available right now." description="We couldn’t load the current allocations." action={refetch} /> : isPending ? <div className="grid gap-5 md:grid-cols-3" role="status" aria-label="Loading budgets"><Skeleton className="h-32 rounded-2xl" /><Skeleton className="h-32 rounded-2xl" /><Skeleton className="h-32 rounded-2xl" /></div> : budgets.length === 0 ? <ContentState title="No budgets configured." description="Allocations will appear here when finance limits are established." /> : <>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider mb-2">Total Budget</p>
          <p className="text-3xl font-display font-bold font-mono tabular-nums text-[var(--color-ink)]">
            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalAllocated / 100)}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider mb-2">Total Spent</p>
          <p className="text-3xl font-display font-bold font-mono tabular-nums text-[var(--color-stop)]">
            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalSpent / 100)}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider mb-2">Overall Utilisation</p>
          <div className="flex items-end gap-3">
            <p className="text-3xl font-display font-bold font-mono tabular-nums text-[var(--color-ink)]">
              {totalUtilisation.toFixed(1)}%
            </p>
            <div className="flex-1 h-2 mb-2 bg-[var(--color-line)] rounded-full overflow-hidden">
              <div 
                className={`h-full ${totalUtilisation > 90 ? 'bg-[var(--color-stop)]' : totalUtilisation > 75 ? 'bg-[var(--color-wait)]' : 'bg-[var(--color-dusk)]'}`}
                style={{ width: `${Math.min(totalUtilisation, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-lg font-display font-bold text-[var(--color-ink)]">Category Limits</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {budgets.map(b => {
            const util = (b.spentPaise / b.allocatedPaise) * 100;
            return (
              <div key={b.id} className="rounded-2xl border border-border bg-card p-6 transition hover:border-primary/30 hover:shadow-md">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold text-[var(--color-ink)]">{b.category}</h3>
                  <span className="text-sm font-medium bg-[var(--color-paper)] border border-[var(--color-line)] px-2 py-1 rounded">
                    {util.toFixed(1)}%
                  </span>
                </div>
                
                <div className="flex justify-between text-sm mb-2 font-mono tabular-nums">
                  <span className="text-[var(--color-muted)]">Spent: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(b.spentPaise / 100)}</span>
                  <span className="font-bold text-[var(--color-ink)]">Limit: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(b.allocatedPaise / 100)}</span>
                </div>
                
                <div className="w-full h-3 bg-[var(--color-line)] rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${util > 90 ? 'bg-[var(--color-stop)]' : util > 75 ? 'bg-[var(--color-wait)]' : 'bg-[var(--color-ok)]'}`}
                    style={{ width: `${Math.min(util, 100)}%` }}
                  ></div>
                </div>
                
              </div>
            );
          })}
        </div>
      </div>
      </>}
    </div>
  );
}
