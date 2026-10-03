import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContentState } from "@/components/common/ContentState";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function Ledger() {
  usePageTitle("General ledger");
  const [filter, setFilter] = useState("ALL"); // ALL, INCOME, EXPENSE

  const { data: ledgerData, isPending, isError, refetch } = useQuery({
    queryKey: ['finance', 'ledger', { filter }],
    queryFn: async () => {
      // API endpoint: GET /finance/ledger?type=...
      const query = filter === "ALL" ? "" : `?type=${filter}`;
      const res = await fetch(`/api/v1/finance/ledger${query}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch ledger");
      return res.json();
    }
  });

  const transactions = ledgerData?.data || [];
  const { data: balanceData } = useQuery({ queryKey: ["finance", "balance"], queryFn: async () => { const response = await fetch("/api/v1/finance/balance", { credentials: "include" }); if (!response.ok) throw new Error("Failed to fetch balance"); return response.json(); } });
  const balancePaise = balanceData?.data?.balancePaise || 0;

  function exportCsv() {
    const escape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const rows = [["Date", "Description", "Category", "Direction", "Amount (INR)"], ...transactions.map((item) => [item.date, item.description, item.category, item.type, (item.amountPaise / 100).toFixed(2)])];
    const url = URL.createObjectURL(new Blob([rows.map((row) => row.map(escape).join(",")).join("\r\n")], { type: "text/csv" }));
    const link = document.createElement("a"); link.href = url; link.download = `skyline-ledger-${filter.toLowerCase()}.csv`; link.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="page-container py-12 sm:py-16">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
        <div>
          <p className="mb-2 text-sm font-medium text-primary">Finance</p>
          <h1 className="font-display text-4xl font-semibold tracking-tight">General ledger</h1>
          <p className="mt-2 text-sm text-muted-foreground">A chronological record of Skyline income and expenses.</p>
        </div>
        
        {/* Balance Header */}
        <div className="flex items-center gap-6 rounded-2xl bg-[#272747] px-6 py-4 text-white">
          <div>
            <p className="text-xs text-white/80 uppercase tracking-wider mb-1">Current Balance</p>
            <p className="text-3xl font-display font-bold font-mono tabular-nums">
              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(balancePaise / 100)}
            </p>
          </div>
          <Button onClick={exportCsv} disabled={!transactions.length} className="bg-white text-[#272747] hover:bg-[#eeedf7]"><Download /> Export CSV</Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        
        {/* Filters */}
        <div className="flex flex-wrap gap-2 border-b border-border bg-secondary/40 p-4">
          {["ALL", "INCOME", "EXPENSE"].map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`min-h-10 rounded-md px-4 text-sm font-medium transition-colors ${filter === t ? 'bg-primary text-primary-foreground' : 'border border-border bg-card hover:bg-secondary'}`}
            >
              {t === 'ALL' ? 'All Transactions' : t === 'INCOME' ? 'Income Only' : 'Expenses Only'}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--color-line)]">
            <thead className="bg-white">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-ink)] uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-ink)] uppercase tracking-wider">Description</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-ink)] uppercase tracking-wider">Category</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-[var(--color-ink)] uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {isPending ? (
                <tr><td colSpan="4" className="p-6"><Skeleton className="h-32" /></td></tr>
              ) : isError ? (
                <tr><td colSpan="4" className="p-6"><ContentState error title="The ledger isn’t available." description="Try loading the records again." action={refetch} /></td></tr>
              ) : transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-muted)]">
                    {new Date(tx.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-[var(--color-ink)]">
                    {tx.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-muted)]">
                    <span className="bg-[var(--color-paper)] border border-[var(--color-line)] px-2 py-1 rounded text-xs">
                      {tx.category}
                    </span>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-mono text-right tabular-nums font-bold ${tx.type === 'INCOME' ? 'text-[var(--color-ok)]' : 'text-[var(--color-ink)]'}`}>
                    {tx.type === 'INCOME' ? '+' : '-'} {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(tx.amountPaise / 100)}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && !isPending && !isError && (
                <tr><td colSpan="4" className="p-10 text-center"><Landmark className="mx-auto mb-3 size-8 text-primary/40" /><p className="text-sm text-muted-foreground">No transactions found for this view.</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
