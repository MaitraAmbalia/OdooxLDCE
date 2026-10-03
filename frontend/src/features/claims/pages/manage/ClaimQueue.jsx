import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function ClaimQueue() {
  const queryClient = useQueryClient();
  const [selectedClaim, setSelectedClaim] = useState(null); // Used to open the drawer
  const [rejectReason, setRejectReason] = useState("");

  const { data: claimsData, isLoading } = useQuery({
    queryKey: ['claims', 'queue', { awaitingMe: true }],
    queryFn: async () => {
      // API endpoint: GET /claims?awaitingMe=true
      const res = await fetch("/api/v1/claims?awaitingMe=true");
      if (!res.ok) throw new Error("Failed to fetch claims");
      return res.json();
    }
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ claimId, decision, reason }) => {
      // API endpoint: POST /claims/:id/review
      console.log(`Reviewing claim ${claimId}: ${decision}`, { reason });
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims', 'queue'] });
      setSelectedClaim(null);
      setRejectReason("");
    }
  });

  const claims = claimsData?.data || [];
  
  // Mock data if backend isn't returning yet
  const mockClaims = claims.length > 0 ? claims : [
    { id: '1', amountPaise: 150000, submitter: 'Aarav Shah', description: 'Paint for stage', ageDays: 2, status: 'SUBMITTED', link: 'Tech Gala 2026' },
    { id: '2', amountPaise: 45000, submitter: 'Neha Gupta', description: 'Snacks for volunteers', ageDays: 5, status: 'SUBMITTED', link: 'Task: Buy Snacks' }
  ];

  if (isLoading) return <div className="p-8 text-[var(--color-muted)]">Loading queue...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 flex relative">
      
      {/* Queue Table */}
      <div className={`flex-1 transition-all ${selectedClaim ? 'lg:pr-96' : ''}`}>
        <h1 className="text-3xl font-display font-extrabold text-[var(--color-ink)] mb-8">Expense Claims</h1>
        
        <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[10px] overflow-hidden">
          <table className="min-w-full divide-y divide-[var(--color-line)]">
            <thead className="bg-[var(--color-paper)]">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-ink)] uppercase tracking-wider">Date/Age</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-ink)] uppercase tracking-wider">Submitter</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-ink)] uppercase tracking-wider">Description</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-[var(--color-ink)] uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-line)] bg-white">
              {mockClaims.map((claim) => (
                <tr 
                  key={claim.id} 
                  onClick={() => setSelectedClaim(claim)}
                  className={`cursor-pointer hover:bg-gray-50 ${selectedClaim?.id === claim.id ? 'bg-[var(--color-paper)]' : ''}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-muted)]">{claim.ageDays} days ago</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--color-ink)]">{claim.submitter}</td>
                  <td className="px-6 py-4 text-sm text-[var(--color-ink)]">
                    <p className="truncate max-w-[200px]">{claim.description}</p>
                    <p className="text-xs text-[var(--color-muted)]">{claim.link}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-ink)] font-mono text-right tabular-nums">
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(claim.amountPaise / 100)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {mockClaims.length === 0 && (
            <div className="p-8 text-center text-[var(--color-muted)]">No claims awaiting your review.</div>
          )}
        </div>
      </div>

      {/* Review Drawer (Right Side on Desktop, Overlaid on Mobile) */}
      {selectedClaim && (
        <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-[var(--color-surface)] border-l border-[var(--color-line)] shadow-2xl z-40 flex flex-col transform transition-transform">
          <div className="p-4 border-b border-[var(--color-line)] flex justify-between items-center bg-[var(--color-paper)]">
            <h2 className="text-lg font-display font-bold">Review Claim</h2>
            <button onClick={() => setSelectedClaim(null)} className="text-[var(--color-muted)] hover:text-[var(--color-ink)] text-xl leading-none">&times;</button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider mb-1">Amount</p>
              <p className="text-3xl font-display font-bold font-mono tabular-nums">
                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(selectedClaim.amountPaise / 100)}
              </p>
            </div>
            
            <div>
              <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider mb-1">Submitter</p>
              <p className="font-medium text-[var(--color-ink)]">{selectedClaim.submitter}</p>
            </div>
            
            <div>
              <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider mb-1">Description</p>
              <p className="text-sm">{selectedClaim.description}</p>
              <p className="text-xs text-[var(--color-dusk)] mt-1">{selectedClaim.link}</p>
            </div>

            <div>
              <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider mb-2">Receipts</p>
              <div className="h-40 bg-gray-200 rounded-[6px] flex items-center justify-center text-[var(--color-muted)] text-sm border border-[var(--color-line)]">
                [Receipt Image Placeholder]
              </div>
            </div>

            <div className="pt-6 border-t border-[var(--color-line)] space-y-4">
              <button 
                onClick={() => reviewMutation.mutate({ claimId: selectedClaim.id, decision: 'APPROVE' })}
                disabled={reviewMutation.isPending}
                className="w-full py-2 bg-[var(--color-ok)] text-white font-medium rounded-[6px] hover:bg-opacity-90 transition-opacity"
              >
                Approve Claim
              </button>
              
              <div>
                <input 
                  type="text" 
                  placeholder="Reason for rejection (required)"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--color-line)] rounded-[6px] text-sm mb-2"
                />
                <button 
                  onClick={() => reviewMutation.mutate({ claimId: selectedClaim.id, decision: 'REJECT', reason: rejectReason })}
                  disabled={!rejectReason.trim() || reviewMutation.isPending}
                  className="w-full py-2 bg-white text-[var(--color-stop)] border border-[var(--color-stop)] font-medium rounded-[6px] hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  Reject Claim
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
