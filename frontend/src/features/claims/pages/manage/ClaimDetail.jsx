import { useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ReceiptIndianRupee } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ContentState } from "@/components/common/ContentState";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function ClaimDetail() {
  const { id } = useParams();
  const location = useLocation();
  const isManagerView = location.pathname.startsWith("/manage/");
  const queryClient = useQueryClient();
  const [rejectReason, setRejectReason] = useState("");

  const { data: claimsData, isPending, isError, refetch } = useQuery({
    queryKey: ['claims', id],
    queryFn: async () => {
      const res = await fetch(isManagerView ? "/api/v1/claims" : "/api/v1/claims/me", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch claim");
      return res.json();
    }
  });
  const claim = claimsData?.data?.find((item) => item.id === id);
  usePageTitle(claim ? `Claim ${claim.id.slice(0, 8)}` : "Claim details");

  const updateStatusMutation = useMutation({
    mutationFn: async ({ status, comment }) => {
      const decision = status === "APPROVED" ? "APPROVE" : "REJECT";
      const response = await fetch(`/api/v1/claims/${id}/review`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision, reason: comment }) });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error?.message || "Could not review claim");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims', id] });
      setRejectReason("");
      toast.success("Claim review saved.");
    },
    onError: (error) => toast.error(error.message || "Could not review claim."),
  });

  if (isPending) return <div className="page-container max-w-4xl py-12" role="status" aria-label="Loading claim"><Skeleton className="h-10 w-56" /><Skeleton className="mt-8 h-80 rounded-2xl" /></div>;
  if (isError || !claim) return <div className="page-container py-16"><ContentState error title="We couldn’t load this claim." description="It may not exist or may not be available to your account." action={refetch} /></div>;

  return (
    <div className="page-container max-w-4xl py-12 sm:py-16">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <Link to={isManagerView ? "/manage/claims" : "/volunteer"} className="mb-4 inline-flex min-h-10 items-center gap-2 text-sm font-medium text-primary hover:underline">
            <ArrowLeft className="size-4" /> Back
          </Link>
          <h1 className="font-display text-4xl font-semibold tracking-tight">Claim #{claim.id.split('-')[0].toUpperCase()}</h1>
        </div>
        <span className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${
          claim.status === 'PAID' ? 'bg-[var(--color-ok)] text-white' : 
          claim.status === 'REJECTED' ? 'bg-[var(--color-stop)] text-white' : 
          'bg-[var(--color-wait)] text-white'
        }`}>
          {claim.status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Details & Receipts */}
        <div className="md:col-span-2 space-y-8">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 font-display text-xl font-semibold">Expense details</h2>
            
            <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
              <div>
                <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider mb-1">Submitter</p>
                <p className="font-medium text-[var(--color-ink)]">{claim.user?.name || "Unknown"}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider mb-1">Amount</p>
                <p className="font-medium text-[var(--color-ink)] font-mono tabular-nums">
                  {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(claim.amountPaise / 100)}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider mb-1">Date Spent</p>
                <p className="text-[var(--color-ink)]">
                  {claim.dateSpent ? new Date(claim.dateSpent).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : "Not available"}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider mb-1">Category</p>
                <p className="text-[var(--color-ink)]">{claim.category || "General expense"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider mb-1">Description</p>
                <p className="text-[var(--color-ink)]">{claim.description}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 font-display text-xl font-semibold">Receipts</h2>
            {claim.receiptUrls && claim.receiptUrls.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {claim.receiptUrls.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer" className="block aspect-square bg-gray-100 rounded-[6px] border border-[var(--color-line)] overflow-hidden hover:opacity-80 transition-opacity">
                    <img src={url} alt={`Receipt ${i+1}`} className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            ) : (
              <p className="flex items-center gap-2 text-sm text-muted-foreground"><ReceiptIndianRupee className="size-4" /> No persisted receipts are attached.</p>
            )}
          </div>
        </div>

        {/* Right Column: Timeline & Actions */}
        <div className="space-y-8">
          <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[10px] p-6 shadow-sm">
            <h2 className="text-lg font-display font-bold text-[var(--color-ink)] mb-4">Status Trail</h2>
            <div className="space-y-4">
              {/* Mock Timeline */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 bg-[var(--color-ok)] rounded-full"></div>
                  <div className="w-0.5 h-full bg-[var(--color-line)] my-1"></div>
                </div>
                <div className="pb-4">
                  <p className="text-sm font-medium text-[var(--color-ink)]">Submitted</p>
                  <p className="text-xs text-[var(--color-muted)]">{new Date(claim.createdAt).toLocaleString('en-IN')}</p>
                </div>
              </div>
              {claim.status !== 'SUBMITTED' && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${claim.status === 'REJECTED' ? 'bg-[var(--color-stop)]' : 'bg-[var(--color-ok)]'}`}></div>
                    <div className="w-0.5 h-full bg-[var(--color-line)] my-1"></div>
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-medium text-[var(--color-ink)]">
                      {claim.status === 'REJECTED' ? 'Rejected' : 'Approved'}
                    </p>
                    <p className="text-xs text-[var(--color-muted)]">By Treasurer</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Panel for Managers */}
          {claim.status === "SUBMITTED" && isManagerView && (
            <div className="rounded-2xl border border-primary/30 bg-secondary/40 p-6">
              <h3 className="mb-4 font-display text-lg font-semibold">Review decision</h3>
              <div className="space-y-3">
                <Button
                  onClick={() => updateStatusMutation.mutate({ status: 'APPROVED' })}
                  disabled={updateStatusMutation.isPending}
                  className="w-full bg-[#345d4a] hover:bg-[#294b3b]"
                >
                  Approve claim
                </Button>
                <Input
                  type="text" 
                  placeholder="Reason for rejection"
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                />
                <Button
                  variant="outline"
                  onClick={() => updateStatusMutation.mutate({ status: 'REJECTED', comment: rejectReason })}
                  disabled={!rejectReason || updateStatusMutation.isPending}
                  className="w-full border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive"
                >
                  Reject claim
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
