import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function ClaimDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [rejectReason, setRejectReason] = useState("");

  const { data: claimData, isLoading } = useQuery({
    queryKey: ['claims', id],
    queryFn: async () => {
      // API endpoint: GET /claims/:id
      const res = await fetch(`/api/v1/claims/${id}`);
      if (!res.ok) throw new Error("Failed to fetch claim");
      return res.json();
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ status, comment }) => {
      // API endpoint: PATCH /claims/:id/status
      console.log(`Updating claim ${id} to ${status}`, { comment });
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims', id] });
      setRejectReason("");
    }
  });

  if (isLoading) return <div className="p-8 text-center text-[var(--color-muted)]">Loading claim details...</div>;
  if (!claimData?.data) return <div className="p-8 text-center text-[var(--color-stop)]">Claim not found.</div>;

  const claim = claimData.data;

  // Derive permissions (in a real app, read from Auth context)
  const canApprove = true; // e.g. user is Treasurer
  const canMarkPaid = claim.status === "APPROVED"; 

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <Link to=".." className="text-sm font-medium text-[var(--color-dusk)] hover:underline inline-block mb-4">
            &larr; Back
          </Link>
          <h1 className="text-3xl font-display font-extrabold text-[var(--color-ink)]">Claim #{claim.id.split('-')[0].toUpperCase()}</h1>
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
          <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[10px] p-6 shadow-sm">
            <h2 className="text-lg font-display font-bold text-[var(--color-ink)] mb-4">Expense Details</h2>
            
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
                  {new Date(claim.dateSpent).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider mb-1">Category</p>
                <p className="text-[var(--color-ink)]">{claim.category}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider mb-1">Description</p>
                <p className="text-[var(--color-ink)]">{claim.description}</p>
              </div>
            </div>
          </div>

          <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[10px] p-6 shadow-sm">
            <h2 className="text-lg font-display font-bold text-[var(--color-ink)] mb-4">Receipts</h2>
            {claim.receiptUrls && claim.receiptUrls.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {claim.receiptUrls.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer" className="block aspect-square bg-gray-100 rounded-[6px] border border-[var(--color-line)] overflow-hidden hover:opacity-80 transition-opacity">
                    <img src={url} alt={`Receipt ${i+1}`} className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--color-muted)]">No receipts attached.</p>
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
          {claim.status === "SUBMITTED" && canApprove && (
            <div className="bg-[var(--color-paper)] border border-[var(--color-dusk)] rounded-[10px] p-6">
              <h3 className="font-semibold text-[var(--color-ink)] mb-4">Review Decision</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => updateStatusMutation.mutate({ status: 'APPROVED' })}
                  disabled={updateStatusMutation.isPending}
                  className="w-full py-2 bg-[var(--color-ok)] text-white font-medium rounded-[6px]"
                >
                  Approve Claim
                </button>
                <input 
                  type="text" 
                  placeholder="Reason for rejection"
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--color-line)] rounded-[6px] text-sm"
                />
                <button 
                  onClick={() => updateStatusMutation.mutate({ status: 'REJECTED', comment: rejectReason })}
                  disabled={!rejectReason || updateStatusMutation.isPending}
                  className="w-full py-2 bg-white text-[var(--color-stop)] border border-[var(--color-stop)] font-medium rounded-[6px]"
                >
                  Reject Claim
                </button>
              </div>
            </div>
          )}

          {canMarkPaid && (
            <div className="bg-[var(--color-paper)] border border-[var(--color-dusk)] rounded-[10px] p-6">
              <h3 className="font-semibold text-[var(--color-ink)] mb-4">Fulfillment</h3>
              <p className="text-sm text-[var(--color-muted)] mb-4">Once you have transferred the funds to the submitter's bank account, mark this claim as paid to update the general ledger.</p>
              <button 
                onClick={() => updateStatusMutation.mutate({ status: 'PAID' })}
                disabled={updateStatusMutation.isPending}
                className="w-full py-2 bg-[var(--color-dusk)] text-white font-medium rounded-[6px]"
              >
                Mark as Paid
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
