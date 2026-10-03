import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ReceiptIndianRupee as ReceiptIndianRupeeIcon } from "lucide-react";
import { ContentState } from "@/components/common/ContentState";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";
import { getJson } from "@/lib/api";
import { formatINR } from "@/lib/utils";
import { StatusBadge } from "@/components/common/StatusBadge";

// One fetch; tabs filter client-side (each claim carries this viewer's nextStep).
const TABS = [
  { id: "awaiting", label: "Awaiting me", match: (c) => Boolean(c.nextStep) },
  { id: "approved", label: "Approved, unpaid", match: (c) => c.status === "APPROVED" },
  { id: "paid", label: "Paid", match: (c) => c.status === "PAID" },
  { id: "all", label: "All", match: () => true },
];
const STEP_LABEL = { L1: "Review", L2: "President approval", PAY: "Pay out" };
export const ROUTE_LABEL = { STANDARD: "Treasurer", HIGH_VALUE: "Treasurer → President", TREASURER_SELF: "Mentor (Treasurer's own claim)" };

export default function ClaimQueue() {
  usePageTitle("Expense claims");
  const [tab, setTab] = useState(TABS[0]);
  const navigate = useNavigate();
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["claims", "queue"],
    queryFn: () => getJson("/claims?limit=100"),
  });
  const all = data?.data || [];
  const claims = all.filter(tab.match);

  return (
    <div className="page-container py-12 sm:py-16">
      <p className="mb-2 text-sm font-medium text-primary">Finance review</p>
      <h1 className="font-display text-4xl font-semibold tracking-tight">Expense claims</h1>
      <p className="mt-2 text-sm text-muted-foreground">Claims up to ₹2,000 need the Treasurer; larger ones also need the President. The Treasurer's own claims go to the Mentor. Approved claims are paid out here.</p>

      <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Claim filters">
        {TABS.map((t) => { const n = all.filter(t.match).length; return <button key={t.id} role="tab" aria-selected={tab.id === t.id} onClick={() => setTab(t)} className={"inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition " + (tab.id === t.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-secondary")}>{t.label}{!isPending && <span className={"rounded-full px-1.5 text-xs tabular-nums " + (tab.id === t.id ? "bg-white/20" : "bg-muted")}>{n}</span>}</button>; })}
      </div>

      <div className="mt-6">
        {isPending ? <Skeleton className="h-80 rounded-2xl" />
          : isError ? <ContentState error title="Claims aren’t available right now." description="We couldn’t load the review queue." action={refetch} />
          : claims.length === 0 ? <ContentState icon={ReceiptIndianRupeeIcon} title={tab.id === "awaiting" ? "The review queue is clear." : "No claims here."} description="Claims needing your decision or payout will appear here." />
          : (
            <div className="overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-secondary/40 text-left text-xs font-semibold uppercase tracking-wider"><tr><th className="px-5 py-3">Age</th><th className="px-5 py-3">Submitter</th><th className="px-5 py-3">Description</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Amount</th><th className="px-5 py-3"><span className="sr-only">Open</span></th></tr></thead>
                <tbody className="divide-y divide-border">
                  {claims.map((claim) => (
                    <tr key={claim.id} onClick={() => navigate(`/manage/claims/${claim.id}`)} className="cursor-pointer transition-colors hover:bg-secondary/40">
                      <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">{claim.ageDays === 0 ? "Today" : `${claim.ageDays}d ago`}</td>
                      <td className="whitespace-nowrap px-5 py-4 font-medium">{claim.submitter}</td>
                      <td className="px-5 py-4"><p className="max-w-[260px] truncate">{claim.description}</p><p className="text-xs text-muted-foreground">{claim.link} · {claim.receipts.length} receipt{claim.receipts.length === 1 ? "" : "s"}</p></td>
                      <td className="whitespace-nowrap px-5 py-4"><StatusBadge status={claim.status} />{claim.nextStep && <p className="mt-1 text-xs text-primary">{STEP_LABEL[claim.nextStep.level]}</p>}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-right font-mono tabular-nums">{formatINR(claim.amountPaise, true)}</td>
                      <td className="px-5 py-4 text-right"><Link to={`/manage/claims/${claim.id}`} onClick={(e) => e.stopPropagation()} aria-label={`Open claim: ${claim.description}`} className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-primary"><ArrowRight className="size-4" aria-hidden="true" /></Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  );
}
