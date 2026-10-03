import React from "react";
import { useQuery } from "@tanstack/react-query";

export default function Budget() {
  const { data: budgetData, isLoading } = useQuery({
    queryKey: ['finance', 'budget'],
    queryFn: async () => {
      // API endpoint: GET /finance/budget
      const res = await fetch("/api/v1/finance/budget");
      if (!res.ok) throw new Error("Failed to fetch budget");
      return res.json();
    }
  });

  const budgets = budgetData?.data || [];

  // Mock data
  const mockBudgets = budgets.length > 0 ? budgets : [
    { id: '1', category: 'Events & Logistics', allocatedPaise: 5000000, spentPaise: 1500000 },
    { id: '2', category: 'Marketing & PR', allocatedPaise: 2000000, spentPaise: 1800000 },
    { id: '3', category: 'Operations', allocatedPaise: 1000000, spentPaise: 200000 }
  ];

  const totalAllocated = mockBudgets.reduce((acc, curr) => acc + curr.allocatedPaise, 0);
  const totalSpent = mockBudgets.reduce((acc, curr) => acc + curr.spentPaise, 0);
  const totalUtilisation = (totalSpent / totalAllocated) * 100;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-extrabold text-[var(--color-ink)]">Budget Allocations</h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">Track spending against allocated limits for the current fiscal year.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[var(--color-surface)] border border-[var(--color-line)] p-6 rounded-[10px] shadow-sm">
          <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider mb-2">Total Budget</p>
          <p className="text-3xl font-display font-bold font-mono tabular-nums text-[var(--color-ink)]">
            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalAllocated / 100)}
          </p>
        </div>
        <div className="bg-[var(--color-surface)] border border-[var(--color-line)] p-6 rounded-[10px] shadow-sm">
          <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider mb-2">Total Spent</p>
          <p className="text-3xl font-display font-bold font-mono tabular-nums text-[var(--color-stop)]">
            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalSpent / 100)}
          </p>
        </div>
        <div className="bg-[var(--color-surface)] border border-[var(--color-line)] p-6 rounded-[10px] shadow-sm">
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
          {isLoading ? (
            <div className="col-span-full p-8 text-center text-[var(--color-muted)]">Loading budget...</div>
          ) : mockBudgets.map(b => {
            const util = (b.spentPaise / b.allocatedPaise) * 100;
            return (
              <div key={b.id} className="bg-[var(--color-surface)] border border-[var(--color-line)] p-6 rounded-[10px] shadow-sm hover:shadow-md transition-shadow">
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
                
                <div className="mt-4 pt-4 border-t border-[var(--color-line)] text-right">
                  <button className="text-sm text-[var(--color-dusk)] font-medium hover:underline">Adjust Allocation &rarr;</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
