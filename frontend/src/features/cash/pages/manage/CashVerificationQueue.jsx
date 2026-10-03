import React from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function CashVerificationQueue() {
  const queryClient = useQueryClient();

  const { data: cashData, isLoading } = useQuery({
    queryKey: ['cashCollections', 'pending'],
    queryFn: async () => {
      // API endpoint: GET /cash-collections?status=PENDING
      const res = await fetch("/api/v1/cash-collections?status=PENDING");
      if (!res.ok) throw new Error("Failed to fetch cash collections");
      return res.json();
    }
  });

  const verifyMutation = useMutation({
    mutationFn: async (id) => {
      // API endpoint: PATCH /cash-collections/:id/verify
      console.log(`Verifying cash collection ${id}`);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashCollections', 'pending'] });
    }
  });

  const collections = cashData?.data || [];

  // Mock data if empty
  const mockCollections = collections.length > 0 ? collections : [
    { id: '1', recordedAt: '2026-10-02T14:30:00Z', operator: 'Sarah Jenkins', amountPaise: 15000, purpose: 'MEMBERSHIP', payerInfo: 'Aarav Shah / 2026101', status: 'PENDING' },
    { id: '2', recordedAt: '2026-10-02T15:45:00Z', operator: 'Mike Chen', amountPaise: 30000, purpose: 'EVENT_TICKET', payerInfo: 'Tech Gala Ticket x2', status: 'PENDING' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-extrabold text-[var(--color-ink)]">Cash Verification</h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">Review and verify cash handed over by desk operators.</p>
      </div>

      <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[10px] overflow-hidden shadow-sm">
        <div className="p-4 bg-[var(--color-paper)] border-b border-[var(--color-line)]">
          <p className="text-sm font-semibold text-[var(--color-ink)]">Pending Verifications</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--color-line)]">
            <thead className="bg-white">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-ink)] uppercase tracking-wider">Date/Time</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-ink)] uppercase tracking-wider">Operator</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-ink)] uppercase tracking-wider">Details</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-[var(--color-ink)] uppercase tracking-wider">Amount</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-[var(--color-ink)] uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-line)] bg-white">
              {isLoading ? (
                <tr><td colSpan="5" className="p-8 text-center text-[var(--color-muted)]">Loading queue...</td></tr>
              ) : mockCollections.map((col) => (
                <tr key={col.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-muted)]">
                    {new Date(col.recordedAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--color-ink)]">
                    {col.operator}
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--color-ink)]">
                    <p className="font-medium">{col.purpose}</p>
                    <p className="text-xs text-[var(--color-muted)]">{col.payerInfo}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-bold text-right tabular-nums text-[var(--color-ink)]">
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(col.amountPaise / 100)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <button 
                      onClick={() => verifyMutation.mutate(col.id)}
                      disabled={verifyMutation.isPending}
                      className="bg-[var(--color-ok)] text-white px-4 py-1.5 rounded-[6px] font-medium hover:bg-opacity-90 disabled:opacity-50"
                    >
                      Verify Received
                    </button>
                  </td>
                </tr>
              ))}
              {mockCollections.length === 0 && !isLoading && (
                <tr><td colSpan="5" className="p-8 text-center text-[var(--color-muted)]">No cash pending verification.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
