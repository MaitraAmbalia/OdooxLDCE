import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContentState } from "@/components/common/ContentState";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function Reports() {
  usePageTitle("Financial reports");
  const [reportType, setReportType] = useState("SUMMARY"); // SUMMARY, EVENT, PROJECT

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['finance', 'reports', reportType],
    queryFn: async () => {
      // API endpoint: GET /finance/reports?type=...
      const res = await fetch(`/api/v1/finance/reports?type=${reportType}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch reports");
      return res.json();
    }
  });
  const report = data?.data;
  const money = (paise) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format((paise || 0) / 100);
  function downloadCsv() {
    if (!report) return;
    const csv = `Metric,Value\r\nReport type,${report.reportType}\r\nRows,${report.rowCount}\r\nTotal income,${(report.totalIncomePaise / 100).toFixed(2)}\r\nTotal expense,${(report.totalExpensePaise / 100).toFixed(2)}\r\nBalance,${(report.balancePaise / 100).toFixed(2)}\r\n`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); const link = document.createElement("a"); link.href = url; link.download = `skyline-finance-${reportType.toLowerCase()}.csv`; link.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="page-container py-12 sm:py-16">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-sm font-medium text-primary">Finance</p>
          <h1 className="font-display text-4xl font-semibold tracking-tight">Financial reports</h1>
          <p className="mt-2 text-sm text-muted-foreground">Review and export current financial summaries.</p>
        </div>
        <Button onClick={downloadCsv} disabled={!report}><Download /> Download CSV</Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex flex-wrap gap-2 border-b border-border bg-secondary/40 p-4">
          {['SUMMARY', 'EVENT', 'PROJECT'].map(t => (
            <button
              key={t}
              onClick={() => setReportType(t)}
              className={`min-h-10 rounded-md px-4 text-sm font-medium transition-colors ${reportType === t ? 'bg-primary text-primary-foreground' : 'border border-border bg-card hover:bg-secondary'}`}
            >
              {t === 'SUMMARY' ? 'Overall Summary' : t === 'EVENT' ? 'Per-Event' : 'Per-Project'}
            </button>
          ))}
        </div>

        <div className="p-8">
          {isPending ? (
            <div role="status" aria-label="Generating report"><Skeleton className="h-64 rounded-2xl" /></div>
          ) : isError ? <ContentState error title="The report isn’t available." description="We couldn’t generate this financial summary." action={refetch} /> : (
            <div className="rounded-2xl border border-dashed border-border bg-secondary/20 px-4 py-14 text-center">
              <FileSpreadsheet className="mx-auto mb-4 size-9 text-primary" />
              <h2 className="mb-2 font-display text-2xl font-semibold">{reportType === "SUMMARY" ? "Overall summary" : reportType === "EVENT" ? "Event summary" : "Project summary"}</h2>
              <p className="mx-auto mb-6 max-w-md text-sm text-muted-foreground">
                Current aggregated financial data returned by the finance service.
              </p>
              
              <div className="flex justify-center gap-6 text-left max-w-lg mx-auto bg-white p-6 rounded-[10px] border border-[var(--color-line)] shadow-sm">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Rows</p>
                  <p className="font-mono text-lg font-semibold">{report?.rowCount || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Total Income</p>
                  <p className="font-mono text-lg font-semibold text-[#345d4a]">{money(report?.totalIncomePaise)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Total Expense</p>
                  <p className="font-mono text-lg font-semibold">{money(report?.totalExpensePaise)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
