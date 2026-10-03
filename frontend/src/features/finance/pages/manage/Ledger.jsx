import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";

export default function Ledger() {
  const [filter, setFilter] = useState("ALL"); // ALL, INCOME, EXPENSE

  const { data: ledgerData, isLoading } = useQuery({
    queryKey: ['finance', 'ledger', { filter }],
    queryFn: async () => {
      // API endpoint: GET /finance/ledger?type=...
      const res = await fetch(`/api/v1/finance/ledger?type=${filter}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch ledger");
      return res.json();
    }
  });

  const transactions = ledgerData?.data || [];
  
  // Mock data if API isn't wired
  const mockTransactions = transactions.length > 0 ? transactions : [
    { id: '1', date: '2026-10-02', type: 'INCOME', description: 'Membership Dues (Aarav Shah)', amountPaise: 15000, category: 'MEMBERSHIP' },
    { id: '2', date: '2026-10-01', type: 'EXPENSE', description: 'Stage Paint (Reimbursement)', amountPaise: 150000, category: 'LOGISTICS' },
    { id: '3', date: '2026-09-30', type: 'INCOME', description: 'Ticket Sale x2 (Tech Gala)', amountPaise: 30000, category: 'EVENT_TICKETS' }
  ];

  const filteredTransactions = filter === "ALL" ? mockTransactions : mockTransactions.filter(t => t.type === filter);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-display font-extrabold text-[var(--color-ink)]">General Ledger</h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">Official financial records for Skyline</p>
        </div>
        
        {/* Balance Header */}
        <div className="bg-[var(--color-dusk)] text-white px-6 py-4 rounded-[10px] shadow-sm flex items-center gap-6">
          <div>
            <p className="text-xs text-white/80 uppercase tracking-wider mb-1">Current Balance</p>
            <p className="text-3xl font-display font-bold font-mono tabular-nums">
              ₹45,250.00
            </p>
          </div>
          <button className="text-xs bg-white text-[var(--color-dusk)] px-3 py-1.5 rounded font-bold hover:bg-opacity-90 transition-colors">
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[10px] overflow-hidden shadow-sm">
        
        {/* Filters */}
        <div className="p-4 bg-[var(--color-paper)] border-b border-[var(--color-line)] flex gap-2">
          {["ALL", "INCOME", "EXPENSE"].map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-4 py-2 rounded-[6px] text-sm font-medium transition-colors ${filter === t ? 'bg-[var(--color-dusk)] text-white' : 'bg-white border border-[var(--color-line)] text-[var(--color-ink)] hover:bg-gray-50'}`}
            >
              {t === 'ALL' ? 'All Transactions' : t === 'INCOME' ? 'Income Only' : 'Expenses Only'}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--color-line)]">
            <thead className="bg-white">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-ink)] uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-ink)] uppercase tracking-wider">Description</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-ink)] uppercase tracking-wider">Category</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-[var(--color-ink)] uppercase tracking-wider">Amount</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-[var(--color-ink)] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-line)] bg-white">
              {isLoading ? (
                <tr><td colSpan="5" className="p-8 text-center text-[var(--color-muted)]">Loading ledger...</td></tr>
              ) : filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-muted)]">
                    {new Date(tx.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-[var(--color-ink)]">
                    {tx.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-muted)]">
                    <span className="bg-[var(--color-paper)] border border-[var(--color-line)] px-2 py-1 rounded text-xs">
                      {tx.category}
                    </span>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-mono text-right tabular-nums font-bold ${tx.type === 'INCOME' ? 'text-[var(--color-ok)]' : 'text-[var(--color-ink)]'}`}>
                    {tx.type === 'INCOME' ? '+' : '-'} {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(tx.amountPaise / 100)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-[var(--color-stop)] hover:underline ml-4" title="Reverse Transaction">
                      Reverse
                    </button>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && !isLoading && (
                <tr><td colSpan="5" className="p-8 text-center text-[var(--color-muted)]">No transactions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
