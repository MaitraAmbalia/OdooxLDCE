import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ContentState } from "@/components/common/ContentState";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useSession } from "@/hooks/useSession";
import { getJson, sendJson } from "@/lib/api";
import { formatINR } from "@/lib/utils";

const inr = (paise) => formatINR(paise ?? 0, true);
// Budget periods are half-years: ODD = Jul–Dec, EVEN = Jan–Jun (backend lib/period.js).
const periodOf = (d = new Date()) => `${d.getFullYear()}-${d.getMonth() >= 6 ? "ODD" : "EVEN"}`;
const periodLabel = (p) => { const [y, h] = p.split("-"); return h === "ODD" ? `Jul–Dec ${y}` : `Jan–Jun ${y}`; };
const shift = (p, by) => { const [y, h] = p.split("-"); const i = Number(y) * 2 + (h === "ODD" ? 1 : 0) + by; return `${Math.floor(i / 2)}-${i % 2 ? "ODD" : "EVEN"}`; };
const SPENDING = ["REIMBURSEMENT", "PURCHASE", "REFUND", "OTHER"];
const SOURCE_LABEL = { UNIVERSITY_GRANT: "University grant", CARRY_FORWARD: "Carry forward", OTHER: "Other" };

export default function Budget() {
  usePageTitle("Budget");
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const permissions = session?.data?.permissions || [];
  const [period, setPeriod] = useState(periodOf());
  const [allocation, setAllocation] = useState({ amount: "", source: "UNIVERSITY_GRANT", note: "" });
  const [limits, setLimits] = useState(null); // edit buffer: { CATEGORY: rupees }

  const allocations = useQuery({ queryKey: ["finance", "allocations", period], queryFn: () => getJson(`/budgets/allocations?period=${period}`) });
  const usage = useQuery({ queryKey: ["finance", "utilization", period], queryFn: () => getJson(`/budgets/utilization?period=${period}`) });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["finance"] });

  const allocate = useMutation({
    mutationFn: () => sendJson("/budgets/allocations", { body: { period, amountPaise: Math.round(Number(allocation.amount) * 100), source: allocation.source, ...(allocation.note.trim() ? { note: allocation.note.trim() } : {}) } }),
    onSuccess: () => { setAllocation({ amount: "", source: "UNIVERSITY_GRANT", note: "" }); refresh(); toast.success("Budget allocated and posted to the ledger."); },
    onError: (e) => toast.error(e.message),
  });
  const saveLimits = useMutation({
    mutationFn: () => sendJson("/budgets/limits", { method: "PUT", body: { period, limits: Object.entries(limits).filter(([, rupees]) => rupees !== "").map(([category, rupees]) => ({ category, limitPaise: Math.round(Number(rupees) * 100) })) } }),
    onSuccess: () => { setLimits(null); refresh(); toast.success("Spending limits saved."); },
    onError: (e) => toast.error(e.message),
  });

  const rows = allocations.data?.data || [];
  const allocated = rows.reduce((n, a) => n + a.amountPaise, 0);
  const categories = (usage.data?.data?.categories || []).filter((c) => SPENDING.includes(c.category) || c.limitPaise != null);
  const spent = categories.reduce((n, c) => n + c.spentPaise, 0);
  const byCategory = Object.fromEntries(categories.map((c) => [c.category, c]));

  return (
    <div className="page-container py-12 sm:py-16">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-medium text-primary">Finance</p>
          <h1 className="font-display text-4xl font-semibold tracking-tight">Budget</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">The Mentor allocates each semester's budget; the Treasurer manages it with spending limits per category.</p>
        </div>
        <div className="flex items-center gap-2" aria-label="Budget period">
          <Button variant="outline" size="sm" onClick={() => { setPeriod(shift(period, -1)); setLimits(null); }} aria-label="Previous period">←</Button>
          <span className="min-w-32 text-center text-sm font-semibold">{periodLabel(period)}</span>
          <Button variant="outline" size="sm" onClick={() => { setPeriod(shift(period, 1)); setLimits(null); }} aria-label="Next period">→</Button>
        </div>
      </div>

      {allocations.isError || usage.isError ? <ContentState error title="The budget isn’t available right now." description="We couldn’t load this period." action={() => { allocations.refetch(); usage.refetch(); }} />
        : allocations.isPending || usage.isPending ? <div className="grid gap-5 md:grid-cols-3" role="status" aria-label="Loading budget"><Skeleton className="h-32 rounded-2xl" /><Skeleton className="h-32 rounded-2xl" /><Skeleton className="h-32 rounded-2xl" /></div>
        : <>
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[["Allocated", inr(allocated)], ["Spent", inr(spent)], ["Remaining", inr(allocated - spent)]].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-border bg-card p-6"><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p><p className={"font-mono text-3xl font-bold tabular-nums " + (label === "Remaining" && allocated - spent < 0 ? "text-destructive" : "")}>{value}</p></div>
            ))}
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <section className="rounded-2xl border border-border bg-card p-6" aria-labelledby="alloc-heading">
              <h2 id="alloc-heading" className="font-display text-xl font-semibold">Allocations</h2>
              {rows.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">No budget allocated for {periodLabel(period)} yet.</p> : (
                <ul className="mt-3 divide-y divide-border text-sm">{rows.map((a) => <li key={a.id} className="flex justify-between gap-4 py-2.5"><span><span className="font-medium">{SOURCE_LABEL[a.source] ?? a.source}</span>{a.note && <span className="block text-xs text-muted-foreground">{a.note}</span>}<span className="block text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleDateString("en-IN")}</span></span><span className="font-mono">{inr(a.amountPaise)}</span></li>)}</ul>
              )}
              {permissions.includes("budget.allocate") && (
                <form className="mt-5 space-y-3 border-t border-border pt-5" onSubmit={(e) => { e.preventDefault(); allocate.mutate(); }}>
                  <h3 className="text-sm font-semibold">Allocate budget for {periodLabel(period)}</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div><label htmlFor="alloc-amount" className="mb-1.5 block text-xs font-medium">Amount (₹)</label><Input id="alloc-amount" type="number" min="1" step="1" value={allocation.amount} onChange={(e) => setAllocation({ ...allocation, amount: e.target.value })} /></div>
                    <div><label htmlFor="alloc-source" className="mb-1.5 block text-xs font-medium">Source</label><select id="alloc-source" value={allocation.source} onChange={(e) => setAllocation({ ...allocation, source: e.target.value })} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">{Object.entries(SOURCE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
                  </div>
                  <div><label htmlFor="alloc-note" className="mb-1.5 block text-xs font-medium">Note</label><Input id="alloc-note" value={allocation.note} onChange={(e) => setAllocation({ ...allocation, note: e.target.value })} /></div>
                  <Button type="submit" disabled={!(Number(allocation.amount) > 0) || allocate.isPending}>{allocate.isPending ? "Allocating…" : "Allocate"}</Button>
                </form>
              )}
            </section>

            <section className="rounded-2xl border border-border bg-card p-6" aria-labelledby="limits-heading">
              <div className="flex items-center justify-between gap-3">
                <h2 id="limits-heading" className="font-display text-xl font-semibold">Spending limits</h2>
                {permissions.includes("budget.limit.manage") && !limits && <Button variant="outline" size="sm" onClick={() => setLimits(Object.fromEntries(SPENDING.map((c) => [c, byCategory[c]?.limitPaise != null ? byCategory[c].limitPaise / 100 : ""])))}>Edit limits</Button>}
              </div>
              {limits ? (
                <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); saveLimits.mutate(); }}>
                  {SPENDING.map((c) => <div key={c} className="flex items-center gap-3"><label htmlFor={`limit-${c}`} className="w-36 text-sm">{c.charAt(0) + c.slice(1).toLowerCase()}</label><Input id={`limit-${c}`} type="number" min="0" step="1" placeholder="No limit" value={limits[c]} onChange={(e) => setLimits({ ...limits, [c]: e.target.value })} /></div>)}
                  <p className="text-xs text-muted-foreground">Leave blank for no limit. Limits apply to {periodLabel(period)}.</p>
                  <div className="flex gap-2"><Button type="submit" disabled={saveLimits.isPending || Object.values(limits).every((v) => v === "")}>Save limits</Button><Button type="button" variant="ghost" onClick={() => setLimits(null)}>Cancel</Button></div>
                </form>
              ) : categories.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">No limits or spending in this period.</p> : (
                <ul className="mt-4 space-y-4">{categories.map((c) => {
                  const pct = c.limitPaise ? Math.min(100, (c.spentPaise / c.limitPaise) * 100) : 0;
                  return (
                    <li key={c.category}>
                      <div className="mb-1.5 flex justify-between text-sm"><span className="font-medium">{c.category.charAt(0) + c.category.slice(1).toLowerCase()}</span><span className="font-mono text-xs">{inr(c.spentPaise)} / {c.limitPaise == null ? "no limit" : inr(c.limitPaise)}</span></div>
                      {c.limitPaise != null && <div className="h-2 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={`${c.category} used`}><div className={"h-full " + (c.remainingPaise < 0 ? "bg-destructive" : pct > 80 ? "bg-warning" : "bg-success")} style={{ width: `${pct}%` }} /></div>}
                      {c.remainingPaise != null && c.remainingPaise < 0 && <p className="mt-1 text-xs text-destructive">Over by {inr(-c.remainingPaise)}</p>}
                    </li>
                  );
                })}</ul>
              )}
            </section>
          </div>
        </>}
    </div>
  );
}
