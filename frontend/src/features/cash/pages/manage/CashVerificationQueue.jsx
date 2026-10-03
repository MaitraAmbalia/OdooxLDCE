import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Banknote, CheckCircle2, XCircle, Banknote as BanknoteIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { sendJson } from "@/lib/api";
import { PURPOSE_LABEL } from "../CashDesk";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ContentState } from "@/components/common/ContentState";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

export default function CashVerificationQueue() {
  usePageTitle("Cash verification");
  const queryClient = useQueryClient();

  const { data: cashData, isPending, isError, refetch } = useQuery({
    queryKey: ["cashCollections", "pending"],
    queryFn: async () => {
      const response = await fetch("/api/v1/cash-collections?status=PENDING&limit=50", { credentials: "include" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error?.message || "Failed to fetch cash collections");
      return json;
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (id) => {
      const response = await fetch("/api/v1/cash-collections/" + id + "/verify", { method: "PATCH", credentials: "include" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error?.message || "Could not verify cash receipt");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cashCollections"] });
      toast.success("Cash handover verified and posted to the ledger.");
    },
    onError: (error) => toast.error(error.message || "Could not verify cash receipt."),
  });

  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState("");
  const rejectMutation = useMutation({
    mutationFn: (id) => sendJson(`/cash-collections/${id}/reject`, { method: "PATCH", body: { reason: reason.trim() } }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["cashCollections"] }); setRejecting(null); setReason(""); toast.success("Handover rejected and the collector notified."); },
    onError: (error) => toast.error(error.message),
  });
  const rejectForm = (id) => rejecting === id && (
    <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); rejectMutation.mutate(id); }}>
      <label htmlFor={`reason-${id}`} className="sr-only">Reason</label>
      <Input id={`reason-${id}`} autoFocus value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why doesn't it match?" />
      <Button type="submit" size="sm" variant="outline" disabled={reason.trim().length < 3 || rejectMutation.isPending}>Reject</Button>
    </form>
  );
  const rejectButton = (id) => <Button size="sm" variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/5" onClick={() => setRejecting(rejecting === id ? null : id)}><XCircle aria-hidden="true" /> Mismatch</Button>;
  const collections = cashData?.data || [];
  const pendingTotal = collections.reduce((total, collection) => total + Number(collection.amountPaise || 0), 0);

  return (
    <div className="page-container py-12 sm:py-16">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="mb-2 text-sm font-medium text-primary">Treasurer review</p><h1 className="font-display text-4xl font-semibold tracking-tight">Cash verification</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Match each recorded receipt to the physical handover before confirming it.</p></div>
        {!isPending && !isError && <div className="rounded-xl border border-border bg-card px-4 py-3"><p className="text-xs text-muted-foreground">Pending handover</p><p className="mt-1 font-mono text-xl font-semibold tabular-nums">{money.format(pendingTotal / 100)}</p></div>}
      </div>

      {isPending ? (
        <div className="mt-8 space-y-3" role="status" aria-label="Loading verification queue"><Skeleton className="h-24 rounded-2xl" /><Skeleton className="h-24 rounded-2xl" /><Skeleton className="h-24 rounded-2xl" /></div>
      ) : isError ? (
        <div className="mt-8"><ContentState error title="The verification queue isn’t available." description="We couldn’t load pending cash receipts." action={refetch} /></div>
      ) : collections.length === 0 ? (
        <div className="mt-8"><ContentState icon={BanknoteIcon} title="The cash queue is clear." description="New handovers will appear here when desk operators record a receipt." /></div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
          <div className="divide-y divide-border md:hidden">
            {collections.map((collection) => (
              <article key={collection.id} className="p-5">
                <div className="flex items-start justify-between gap-4"><div><p className="font-medium">{PURPOSE_LABEL[collection.purpose] ?? collection.purpose}</p><p className="mt-1 text-xs text-muted-foreground">{collection.payerInfo || "Linked receipt"}</p></div><p className="font-mono text-lg font-semibold tabular-nums">{money.format(Number(collection.amountPaise || 0) / 100)}</p></div>
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><Banknote className="size-4" aria-hidden="true" />{collection.operator || "Cash operator"} · {new Date(collection.recordedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</div>
                <div className="mt-5 flex gap-2"><Button className="flex-1 bg-emerald-700 hover:bg-emerald-800" disabled={verifyMutation.isPending} onClick={() => verifyMutation.mutate(collection.id)}><CheckCircle2 aria-hidden="true" /> Verify received</Button>{rejectButton(collection.id)}</div>{rejectForm(collection.id)}
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-secondary/40"><tr><th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Recorded</th><th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Operator</th><th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Receipt</th><th scope="col" className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider">Amount</th><th scope="col" className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider">Action</th></tr></thead>
              <tbody className="divide-y divide-border">
                {collections.map((collection) => (
                  <tr key={collection.id} className="transition-colors hover:bg-secondary/30">
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">{new Date(collection.recordedAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">{collection.operator || "Cash operator"}</td>
                    <td className="px-6 py-4 text-sm"><p className="font-medium">{PURPOSE_LABEL[collection.purpose] ?? collection.purpose}</p><p className="mt-1 text-xs text-muted-foreground">{collection.payerInfo || "Linked receipt"}</p></td>
                    <td className="whitespace-nowrap px-6 py-4 text-right font-mono text-sm font-semibold tabular-nums">{money.format(Number(collection.amountPaise || 0) / 100)}</td>
                    <td className="px-6 py-4 text-right"><div className="flex justify-end gap-2"><Button size="sm" className="bg-emerald-700 hover:bg-emerald-800" disabled={verifyMutation.isPending} onClick={() => verifyMutation.mutate(collection.id)}><CheckCircle2 aria-hidden="true" /> Verify</Button>{rejectButton(collection.id)}</div>{rejectForm(collection.id)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
