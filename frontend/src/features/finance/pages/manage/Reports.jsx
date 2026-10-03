import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";

export default function Reports() {
  const [reportType, setReportType] = useState("SUMMARY"); // SUMMARY, EVENT, PROJECT

  const { data, isLoading } = useQuery({
    queryKey: ['finance', 'reports', reportType],
    queryFn: async () => {
      // API endpoint: GET /finance/reports?type=...
      const res = await fetch(`/api/v1/finance/reports?type=${reportType}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch reports");
      return res.json();
    }
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-display font-extrabold text-[var(--color-ink)]">Financial Reports</h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">Generate and export financial summaries.</p>
        </div>
        <button className="bg-[var(--color-dusk)] text-white px-6 py-2 rounded-[6px] font-medium hover:bg-opacity-90 transition-colors shadow-sm">
          Download CSV
        </button>
      </div>

      <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[10px] overflow-hidden shadow-sm">
        <div className="p-4 bg-[var(--color-paper)] border-b border-[var(--color-line)] flex gap-2">
          {['SUMMARY', 'EVENT', 'PROJECT'].map(t => (
            <button
              key={t}
              onClick={() => setReportType(t)}
              className={`px-4 py-2 rounded-[6px] text-sm font-medium transition-colors ${reportType === t ? 'bg-[var(--color-ink)] text-white' : 'bg-white border border-[var(--color-line)] text-[var(--color-ink)] hover:bg-gray-50'}`}
            >
              {t === 'SUMMARY' ? 'Overall Summary' : t === 'EVENT' ? 'Per-Event' : 'Per-Project'}
            </button>
          ))}
        </div>

        <div className="p-8">
          {isLoading ? (
            <div className="text-center text-[var(--color-muted)] py-12">Generating report...</div>
          ) : (
            <div className="text-center border-2 border-dashed border-[var(--color-line)] rounded-[10px] py-20 px-4 bg-gray-50">
              <h3 className="text-xl font-display font-bold text-[var(--color-ink)] mb-2">Report Ready for Export</h3>
              <p className="text-sm text-[var(--color-muted)] mb-6 max-w-md mx-auto">
                The {reportType.toLowerCase()} report contains aggregated financial data for the current fiscal year.
              </p>
              
              <div className="flex justify-center gap-6 text-left max-w-lg mx-auto bg-white p-6 rounded-[10px] border border-[var(--color-line)] shadow-sm">
                <div>
                  <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider mb-1">Rows</p>
                  <p className="font-mono font-bold text-lg">1,248</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider mb-1">Total Income</p>
                  <p className="font-mono font-bold text-lg text-[var(--color-ok)]">₹4,50,000</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider mb-1">Total Expense</p>
                  <p className="font-mono font-bold text-lg text-[var(--color-ink)]">₹3,20,500</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
