import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Banknote, History, Banknote as BanknoteIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ContentState } from "@/components/common/ContentState";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/common/StatusBadge";
import { usePageTitle } from "@/hooks/usePageTitle";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

export const PURPOSE_LABEL = { MEMBERSHIP: "Membership dues", TICKET: "Event ticket", MERCH: "Merchandise", FUNDRAISER: "Fundraiser" };

export default function CashDesk() {
  usePageTitle("Cash desk");
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("record");
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ defaultValues: { purpose: "MEMBERSHIP", refId: "", amount: "" } });

  const { data: cashData, isPending: historyPending, isError: historyError, refetch } = useQuery({
    queryKey: ["cashCollections"],
    queryFn: async () => {
      const response = await fetch("/api/v1/cash-collections?limit=50", { credentials: "include" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error?.message || "Failed to fetch collections");
      return json;
    },
  });

  const recordCash = useMutation({
    mutationFn: async (data) => {
      const response = await fetch("/api/v1/cash-collections", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose: data.purpose, ...(data.refId.trim() ? { refId: data.refId.trim() } : {}), amountPaise: Math.round(Number(data.amount) * 100) }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error?.message || "Could not record cash");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cashCollections"] });
      reset();
      toast.success("Cash receipt recorded for verification.");
      setActiveTab("history");
    },
    onError: (error) => toast.error(error.message || "Could not record cash."),
  });

  const collections = cashData?.data || [];
  const totalPaise = collections.reduce((total, collection) => total + Number(collection.amountPaise || 0), 0);

  return (
    <div className="page-container max-w-5xl py-12 sm:py-16">
      <Button asChild variant="ghost" className="mb-6 -ml-3"><Link to="/volunteer"><ArrowLeft aria-hidden="true" /> Back to volunteer space</Link></Button>
      <div>
        <p className="mb-2 text-sm font-medium text-primary">Payment collection</p>
        <h1 className="font-display text-4xl font-semibold tracking-tight">Cash desk</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Record physical cash against its membership or ticket reference, then hand it to the Treasurer for verification.</p>
      </div>

      <div className="mt-8 grid grid-cols-2 rounded-xl bg-secondary p-1" role="tablist" aria-label="Cash desk view">
        <button type="button" role="tab" aria-selected={activeTab === "record"} onClick={() => setActiveTab("record")} className={"flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium transition " + (activeTab === "record" ? "bg-card text-primary shadow-xs" : "text-muted-foreground hover:text-foreground")}><Banknote className="size-4" aria-hidden="true" /> Record cash</button>
        <button type="button" role="tab" aria-selected={activeTab === "history"} onClick={() => setActiveTab("history")} className={"flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium transition " + (activeTab === "history" ? "bg-card text-primary shadow-xs" : "text-muted-foreground hover:text-foreground")}><History className="size-4" aria-hidden="true" /> History</button>
      </div>

      {activeTab === "record" && (
        <section className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-8" role="tabpanel" aria-labelledby="record-cash-heading">
          <h2 id="record-cash-heading" className="font-display text-2xl font-semibold">New cash receipt</h2>
          <p className="mt-2 text-sm text-muted-foreground">Only submit after counting and physically receiving the full amount.</p>
          <form onSubmit={handleSubmit((data) => recordCash.mutate(data))} className="mt-7 space-y-6" noValidate>
            <fieldset>
              <legend className="mb-3 text-sm font-medium">Purpose</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {Object.entries(PURPOSE_LABEL).map(([id, label]) => ({ id, label })).map((purpose) => (
                  <label key={purpose.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-4 transition hover:bg-secondary/30 has-[:checked]:border-primary has-[:checked]:bg-primary/5"><input type="radio" value={purpose.id} {...register("purpose")} className="accent-primary" /><span className="text-sm font-medium">{purpose.label}</span></label>
                ))}
              </div>
            </fieldset>

            <div>
              <label htmlFor="cash-reference" className="mb-2 block text-sm font-medium">Membership or ticket reference ID (optional)</label>
              <Input id="cash-reference" placeholder="00000000-0000-0000-0000-000000000000" aria-invalid={!!errors.refId} {...register("refId", { pattern: { value: UUID_PATTERN, message: "Enter a valid membership or ticket reference ID" } })} />
              <p className="mt-2 text-xs leading-5 text-muted-foreground">If the cash is for a specific record, paste its reference so it can be reconciled.</p>
              {errors.refId && <p className="mt-2 text-sm text-destructive" role="alert">{errors.refId.message}</p>}
            </div>

            <div>
              <label htmlFor="cash-amount" className="mb-2 block text-sm font-medium">Amount received (₹)</label>
              <Input id="cash-amount" type="number" min="0.01" step="0.01" inputMode="decimal" placeholder="0.00" className="h-12 font-mono text-lg tabular-nums sm:text-lg" aria-invalid={!!errors.amount} {...register("amount", { required: "Amount is required", valueAsNumber: true, min: { value: 0.01, message: "Enter an amount greater than zero" } })} />
              {errors.amount && <p className="mt-2 text-sm text-destructive" role="alert">{errors.amount.message}</p>}
            </div>

            <div className="rounded-xl border border-warning/30 bg-warning-soft p-4 text-sm leading-6 text-warning"><strong>Confirm before recording:</strong> this entry is linked to your account and remains pending until the Treasurer verifies the handover.</div>
            <Button type="submit" size="lg" className="w-full" disabled={recordCash.isPending}>{recordCash.isPending ? "Recording…" : "Record cash receipt"}</Button>
          </form>
        </section>
      )}

      {activeTab === "history" && (
        <section className="mt-6" role="tabpanel" aria-labelledby="collection-history-heading">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 id="collection-history-heading" className="font-display text-2xl font-semibold">Recent collections</h2><p className="mt-1 text-sm text-muted-foreground">The latest recorded cash receipts across the desk.</p></div>{!historyPending && !historyError && <p className="text-sm text-muted-foreground">Listed total <span className="font-mono font-semibold text-foreground">{money.format(totalPaise / 100)}</span></p>}</div>
          {historyPending ? (
            <div className="space-y-3" role="status" aria-label="Loading collections"><Skeleton className="h-24 rounded-2xl" /><Skeleton className="h-24 rounded-2xl" /></div>
          ) : historyError ? (
            <ContentState error title="Collection history isn’t available." description="We couldn’t load recent receipts." action={refetch} />
          ) : collections.length === 0 ? (
            <ContentState icon={BanknoteIcon} title="No cash has been recorded." description="Completed receipts will appear here after the first collection." />
          ) : (
            <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
              {collections.map((collection) => <div key={collection.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><p className="font-medium">{PURPOSE_LABEL[collection.purpose] ?? collection.purpose}</p><StatusBadge status={collection.status} />{collection.rejectReason && <span className="text-xs text-destructive">{collection.rejectReason}</span>}</div><p className="mt-2 text-xs text-muted-foreground">{collection.operator} · {new Date(collection.recordedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</p></div><p className="font-mono text-lg font-semibold tabular-nums">{money.format(Number(collection.amountPaise || 0) / 100)}</p></div>)}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
