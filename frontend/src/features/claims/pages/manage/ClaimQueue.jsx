import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ReceiptIndianRupee, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ContentState } from "@/components/common/ContentState";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function ClaimQueue() {
  usePageTitle("Expense claims");
  const queryClient = useQueryClient();
  const [selectedClaim, setSelectedClaim] = useState(null); // Used to open the drawer
  const [rejectReason, setRejectReason] = useState("");

  const { data: claimsData, isPending, isError, refetch } = useQuery({
    queryKey: ['claims', 'queue', { awaitingMe: true }],
    queryFn: async () => {
      // API endpoint: GET /claims?awaitingMe=true
      const res = await fetch("/api/v1/claims?awaitingMe=true", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch claims");
      return res.json();
    }
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ claimId, decision, reason }) => {
      const response = await fetch(`/api/v1/claims/${claimId}/review`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision, reason }) });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error?.message || "Could not review claim");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      setSelectedClaim(null);
      setRejectReason("");
      toast.success("Claim review saved.");
    },
    onError: (error) => toast.error(error.message || "Could not review claim."),
  });

  const claims = claimsData?.data || [];
  
  if (isPending) return <div className="page-container py-12" role="status" aria-label="Loading claims"><Skeleton className="h-10 w-60" /><Skeleton className="mt-8 h-80 rounded-2xl" /></div>;

  return (
    <div className="page-container relative flex py-12 sm:py-16">
      
      {/* Queue Table */}
      <div className={`flex-1 transition-all ${selectedClaim ? 'lg:pr-96' : ''}`}>
        <p className="mb-2 text-sm font-medium text-primary">Finance review</p>
        <h1 className="mb-8 font-display text-4xl font-semibold tracking-tight">Expense claims</h1>
        {isError ? <ContentState error title="Claims aren’t available right now." description="We couldn’t load the review queue." action={refetch} /> : claims.length === 0 ? <ContentState title="The review queue is clear." description="New expense claims will appear here when they need your decision." /> : (
        
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-secondary/40">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Date/Age</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Submitter</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Description</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-foreground uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {claims.map((claim) => (
                <tr 
                  key={claim.id} 
                  onClick={() => setSelectedClaim(claim)}
                  tabIndex={0}
                  onKeyDown={(event) => { if (event.key === "Enter") setSelectedClaim(claim); }}
                  className={`cursor-pointer transition-colors hover:bg-secondary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${selectedClaim?.id === claim.id ? 'bg-secondary/50' : ''}`}
                >
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">{claim.ageDays} days ago</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-foreground">{claim.submitter}</td>
                  <td className="px-6 py-4 text-sm">
                    <p className="font-medium text-foreground truncate max-w-[240px]">{claim.description}</p>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">{claim.link}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground font-mono font-medium text-right tabular-nums">
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(claim.amountPaise / 100)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* Review Drawer (Right Side on Desktop, Overlaid on Mobile) */}
      {selectedClaim && (
        <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-card border-l border-border shadow-2xl z-40 flex flex-col transform transition-transform">
          <div className="flex items-center justify-between border-b border-border bg-secondary/40 p-4">
            <h2 className="font-display text-xl font-semibold">Review claim</h2>
            <Button variant="ghost" size="icon" onClick={() => setSelectedClaim(null)} aria-label="Close claim review"><X /></Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Amount</p>
              <p className="text-3xl font-display font-bold font-mono tabular-nums">
                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(selectedClaim.amountPaise / 100)}
              </p>
            </div>
            
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Submitter</p>
              <p className="font-medium text-foreground">{selectedClaim.submitter}</p>
            </div>
            
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Description</p>
              <p className="text-sm font-medium text-foreground">{selectedClaim.description}</p>
              <p className="text-xs text-muted-foreground font-medium mt-1">{selectedClaim.link}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">Receipts</p>
              <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-border bg-secondary/30 text-sm text-muted-foreground">
                <ReceiptIndianRupee className="mr-2 size-5" /> No persisted receipt
              </div>
            </div>

            <div className="pt-6 border-t border-border space-y-4">
              <Button
                onClick={() => reviewMutation.mutate({ claimId: selectedClaim.id, decision: 'APPROVE' })}
                disabled={reviewMutation.isPending}
                className="w-full bg-[#345d4a] hover:bg-[#294b3b]"
              >
                Approve claim
              </Button>
              
              <div>
                <Input
                  type="text" 
                  placeholder="Reason for rejection (required)"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="mb-2"
                />
                <Button
                  variant="outline"
                  onClick={() => reviewMutation.mutate({ claimId: selectedClaim.id, decision: 'REJECT', reason: rejectReason })}
                  disabled={!rejectReason.trim() || reviewMutation.isPending}
                  className="w-full border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive"
                >
                  Reject claim
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
