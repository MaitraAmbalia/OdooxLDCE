import { useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FileText, ReceiptIndianRupee } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ContentState } from "@/components/common/ContentState";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";
import { getJson, sendJson } from "@/lib/api";
import { formatINR } from "@/lib/utils";
import { ROUTE_LABEL, STATUS_LABEL } from "./ClaimQueue";

const inr = (paise) => formatINR(paise ?? 0, true);
const STATUS_STYLE = { PAID: "bg-emerald-600 text-white", REJECTED: "bg-red-600 text-white", APPROVED: "bg-emerald-100 text-emerald-800" };

export default function ClaimDetail() {
  const { id } = useParams();
  const isManagerView = useLocation().pathname.startsWith("/manage/");
  const queryClient = useQueryClient();
  const [rejectReason, setRejectReason] = useState("");
  const [method, setMethod] = useState("UPI");
  const [reference, setReference] = useState("");

  const { data, isPending, isError, refetch } = useQuery({ queryKey: ["claims", id], queryFn: () => getJson(`/claims/${id}`) });
  const claim = data?.data;
  usePageTitle(claim ? `Claim ${claim.id.slice(0, 8).toUpperCase()}` : "Claim details");

  const done = (message) => () => {
    queryClient.invalidateQueries({ queryKey: ["claims"] });
    setRejectReason("");
    toast.success(message);
  };
  const onError = (error) => toast.error(error.message);
  const review = useMutation({
    mutationFn: ({ decision, reason }) => sendJson(`/claims/${id}/review`, { body: { decision, reason } }),
    onSuccess: (_, v) => done(v.decision === "APPROVE" ? "Claim approved." : "Claim rejected.")(),
    onError,
  });
  const pay = useMutation({
    mutationFn: () => sendJson(`/claims/${id}/pay`, { body: { method, reference: reference.trim() } }),
    onSuccess: done("Reimbursement recorded and posted to the ledger."),
    onError,
  });

  if (isPending) return <div className="page-container max-w-4xl py-12" role="status" aria-label="Loading claim"><Skeleton className="h-10 w-56" /><Skeleton className="mt-8 h-80 rounded-2xl" /></div>;
  if (isError || !claim) return <div className="page-container py-16"><ContentState error title="We couldn’t load this claim." description="It may not exist or may not be available to your account." action={refetch} /></div>;

  const step = isManagerView ? claim.nextStep : null;
  const budget = claim.eventBudget;
  const overBudget = budget && claim.amountPaise > budget.remainingPaise && ["L1", "L2"].includes(step?.level);

  return (
    <div className="page-container max-w-5xl py-12 sm:py-16">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link to={isManagerView ? "/manage/claims" : "/volunteer"} className="mb-4 inline-flex min-h-10 items-center gap-2 text-sm font-medium text-primary hover:underline"><ArrowLeft className="size-4" /> Back</Link>
          <h1 className="font-display text-4xl font-semibold tracking-tight">Claim #{claim.id.split("-")[0].toUpperCase()}</h1>
        </div>
        <span className={"rounded px-3 py-1 text-xs font-bold uppercase tracking-wider " + (STATUS_STYLE[claim.status] || "bg-amber-100 text-amber-800")}>{STATUS_LABEL[claim.status] ?? claim.status}</span>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="space-y-8 md:col-span-2">
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 font-display text-xl font-semibold">Expense details</h2>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <div><dt className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Submitter</dt><dd className="font-medium">{claim.user?.name} · {claim.user?.studentId}</dd></div>
              <div><dt className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Amount</dt><dd className="font-mono font-medium tabular-nums">{inr(claim.amountPaise)}</dd></div>
              <div><dt className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Date spent</dt><dd>{new Date(claim.dateSpent).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}</dd></div>
              <div><dt className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Type</dt><dd>{claim.category.charAt(0) + claim.category.slice(1).toLowerCase()}</dd></div>
              <div><dt className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">For</dt><dd>{claim.link}</dd></div>
              <div><dt className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Approval route</dt><dd>{ROUTE_LABEL[claim.route]}</dd></div>
              <div className="col-span-2"><dt className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Description</dt><dd>{claim.description}</dd></div>
              {claim.paidAt && <div className="col-span-2"><dt className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Paid</dt><dd>{new Date(claim.paidAt).toLocaleString("en-IN")} via {claim.paidMethod.replaceAll("_", " ")} · ref {claim.paidReference}</dd></div>}
            </dl>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 font-display text-xl font-semibold">Receipts</h2>
            {claim.receipts.length ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {claim.receipts.map((r, i) => (
                  <a key={r.url} href={r.url} target="_blank" rel="noreferrer" className="flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-border bg-secondary/30 transition-opacity hover:opacity-80">
                    {r.mime === "application/pdf" ? <span className="flex flex-col items-center gap-2 text-sm text-muted-foreground"><FileText className="size-8" /> Receipt {i + 1} (PDF)</span> : <img src={r.url} alt={`Receipt ${i + 1}`} className="size-full object-cover" />}
                  </a>
                ))}
              </div>
            ) : <p className="flex items-center gap-2 text-sm text-muted-foreground"><ReceiptIndianRupee className="size-4" /> No receipts were attached.</p>}
          </section>
        </div>

        <div className="space-y-8">
          {budget && isManagerView && (
            <section className={"rounded-2xl border p-5 text-sm " + (overBudget ? "border-red-300 bg-red-50" : "border-border bg-card")}>
              <h2 className="font-display text-lg font-semibold">Event budget</h2>
              <dl className="mt-3 space-y-1.5">
                <div className="flex justify-between"><dt>Approved</dt><dd className="font-mono">{inr(budget.approvedPaise)}</dd></div>
                <div className="flex justify-between"><dt>Spent</dt><dd className="font-mono">{inr(budget.spentPaise)}</dd></div>
                <div className="flex justify-between"><dt>Other approved claims</dt><dd className="font-mono">{inr(budget.committedPaise)}</dd></div>
                <div className="flex justify-between border-t border-border pt-1.5 font-semibold"><dt>Remaining</dt><dd className="font-mono">{inr(budget.remainingPaise)}</dd></div>
              </dl>
              {overBudget && <p className="mt-3 text-red-800">This claim is larger than the remaining budget, so it can't be approved. Reject it, or ask the Mentor to raise the event budget.</p>}
            </section>
          )}

          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 font-display text-lg font-semibold">Status trail</h2>
            <ol className="space-y-4 text-sm">
              <li><p className="font-medium">Submitted</p><p className="text-xs text-muted-foreground">{new Date(claim.createdAt).toLocaleString("en-IN")}</p></li>
              {claim.decisions.map((d) => (
                <li key={d.at}><p className={"font-medium " + (d.decision === "REJECT" ? "text-red-700" : "text-emerald-700")}>{d.decision === "REJECT" ? "Rejected" : d.level === "L2" ? "Approved by President" : "Approved"} · {d.decider}</p><p className="text-xs text-muted-foreground">{new Date(d.at).toLocaleString("en-IN")}</p>{d.reason && <p className="mt-1 text-muted-foreground">{d.reason}</p>}</li>
              ))}
              {claim.paidAt && <li><p className="font-medium text-emerald-700">Paid out</p><p className="text-xs text-muted-foreground">{new Date(claim.paidAt).toLocaleString("en-IN")}</p></li>}
            </ol>
          </section>

          {step && ["L1", "L2"].includes(step.level) && (
            <section className="rounded-2xl border border-primary/30 bg-secondary/40 p-6">
              <h2 className="mb-1 font-display text-lg font-semibold">{step.level === "L2" ? "President approval" : "Review decision"}</h2>
              {!step.final && <p className="mb-3 text-xs text-muted-foreground">After your approval this claim goes to the President.</p>}
              <div className="space-y-3">
                <Button onClick={() => review.mutate({ decision: "APPROVE" })} disabled={review.isPending || overBudget} className="w-full">Approve claim</Button>
                <label htmlFor="reject-reason" className="sr-only">Reason for rejection</label>
                <Input id="reject-reason" placeholder="Reason for rejection" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
                <Button variant="outline" onClick={() => review.mutate({ decision: "REJECT", reason: rejectReason.trim() })} disabled={!rejectReason.trim() || review.isPending} className="w-full border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive">Reject claim</Button>
              </div>
            </section>
          )}

          {step?.level === "PAY" && (
            <form className="rounded-2xl border border-primary/30 bg-secondary/40 p-6" onSubmit={(e) => { e.preventDefault(); pay.mutate(); }}>
              <h2 className="mb-1 font-display text-lg font-semibold">Pay reimbursement</h2>
              <p className="mb-4 text-xs text-muted-foreground">Record how you paid {claim.user?.name}. This posts a {inr(claim.amountPaise)} expense to the ledger{claim.link ? ` against ${claim.link}` : ""}.</p>
              <label htmlFor="pay-method" className="mb-1.5 block text-sm font-medium">Method</label>
              <select id="pay-method" value={method} onChange={(e) => setMethod(e.target.value)} className="mb-3 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="UPI">UPI</option><option value="BANK_TRANSFER">Bank transfer</option><option value="CASH">Cash</option></select>
              <label htmlFor="pay-reference" className="mb-1.5 block text-sm font-medium">Transaction reference</label>
              <Input id="pay-reference" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. UPI ref no." className="mb-4" />
              <Button type="submit" className="w-full" disabled={reference.trim().length < 3 || pay.isPending}>{pay.isPending ? "Recording…" : "Mark as paid"}</Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
