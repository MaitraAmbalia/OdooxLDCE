import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContentState } from "@/components/common/ContentState";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";
import { getJson } from "@/lib/api";

const CATEGORY_LABEL = { DUES: "Membership dues", TICKETS: "Ticket sales", MERCH: "Merchandise", FUNDRAISER: "Fundraisers", BUDGET_ALLOCATION: "Budget allocation", SPONSORSHIP: "Sponsorship", REIMBURSEMENT: "Reimbursements", PURCHASE: "Purchases", REFUND: "Refunds", OTHER: "Other" };

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
  const [paymentFilter, setPaymentFilter] = useState("");
  const payments = useQuery({ queryKey: ["finance", "payments", paymentFilter], queryFn: () => getJson(`/finance/payments?limit=25${paymentFilter}`) });
  const money = (paise) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format((paise || 0) / 100);
  function downloadCsv() {
    if (!report) return;
    const rows = [["Metric", "Value"], ["Report type", report.reportType], ["Rows", report.rowCount], ["Total income", (report.totalIncomePaise / 100).toFixed(2)], ["Total expense", (report.totalExpensePaise / 100).toFixed(2)], ["Balance", (report.balancePaise / 100).toFixed(2)], [], ["Category", "In", "Out"], ...report.byCategory.map((c) => [CATEGORY_LABEL[c.category] ?? c.category, (c.inPaise / 100).toFixed(2), (c.outPaise / 100).toFixed(2)]), ...(report.byEvent ? [[], ["Event", "In", "Out", "Approved budget"], ...report.byEvent.map((e) => [`"${e.title.replaceAll('"', '""')}"`, (e.inPaise / 100).toFixed(2), (e.outPaise / 100).toFixed(2), e.approvedBudgetPaise == null ? "" : (e.approvedBudgetPaise / 100).toFixed(2)])] : [])];
    const csv = rows.map((r) => r.join(",")).join("\r\n");
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
            <div className="space-y-8">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-border p-5"><p className="text-xs uppercase tracking-wider text-muted-foreground">Total income</p><p className="mt-1 font-mono text-2xl font-semibold text-emerald-700">{money(report.totalIncomePaise)}</p></div>
                <div className="rounded-xl border border-border p-5"><p className="text-xs uppercase tracking-wider text-muted-foreground">Total expense</p><p className="mt-1 font-mono text-2xl font-semibold">{money(report.totalExpensePaise)}</p></div>
                <div className="rounded-xl border border-border p-5"><p className="text-xs uppercase tracking-wider text-muted-foreground">Net</p><p className="mt-1 font-mono text-2xl font-semibold">{money(report.balancePaise)}</p><p className="text-xs text-muted-foreground">{report.rowCount} ledger rows</p></div>
              </div>
              <div>
                <h2 className="mb-3 font-display text-xl font-semibold"><FileSpreadsheet className="mr-2 inline size-5 text-primary" />By source</h2>
                {report.byCategory.length === 0 ? <p className="text-sm text-muted-foreground">No ledger entries for this view yet.</p> : (
                  <table className="min-w-full divide-y divide-border rounded-xl border border-border text-sm">
                    <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wider"><tr><th className="px-4 py-2">Category</th><th className="px-4 py-2 text-right">In</th><th className="px-4 py-2 text-right">Out</th></tr></thead>
                    <tbody className="divide-y divide-border">{report.byCategory.map((c) => <tr key={c.category}><td className="px-4 py-2">{CATEGORY_LABEL[c.category] ?? c.category}</td><td className="px-4 py-2 text-right font-mono text-emerald-700">{c.inPaise ? money(c.inPaise) : "—"}</td><td className="px-4 py-2 text-right font-mono">{c.outPaise ? money(c.outPaise) : "—"}</td></tr>)}</tbody>
                  </table>
                )}
              </div>
              {report.byEvent && (
                <div>
                  <h2 className="mb-3 font-display text-xl font-semibold">By event</h2>
                  <table className="min-w-full divide-y divide-border rounded-xl border border-border text-sm">
                    <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wider"><tr><th className="px-4 py-2">Event</th><th className="px-4 py-2 text-right">Revenue</th><th className="px-4 py-2 text-right">Spent</th><th className="px-4 py-2 text-right">Approved budget</th></tr></thead>
                    <tbody className="divide-y divide-border">{report.byEvent.map((e) => <tr key={e.eventId}><td className="px-4 py-2">{e.title}</td><td className="px-4 py-2 text-right font-mono">{money(e.inPaise)}</td><td className={"px-4 py-2 text-right font-mono " + (e.approvedBudgetPaise != null && e.outPaise > e.approvedBudgetPaise ? "text-red-700" : "")}>{money(e.outPaise)}</td><td className="px-4 py-2 text-right font-mono">{e.approvedBudgetPaise == null ? "—" : money(e.approvedBudgetPaise)}</td></tr>)}</tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <section className="mt-10 rounded-2xl border border-border bg-card p-6" aria-labelledby="recon-heading">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div><h2 id="recon-heading" className="font-display text-2xl font-semibold">Payment reconciliation</h2><p className="mt-1 text-sm text-muted-foreground">Every online payment beside its ledger entry. Paid payments missing a ledger entry are flagged.</p></div>
          <select aria-label="Filter payments" value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm"><option value="">All payments</option><option value="&status=PAID">Paid</option><option value="&status=CREATED">Awaiting payment</option><option value="&status=FAILED">Failed</option><option value="&status=REFUNDED">Refunded</option><option value="&purpose=TICKET">Tickets</option><option value="&purpose=MERCH_ORDER">Merchandise</option><option value="&purpose=MEMBERSHIP">Membership</option></select>
        </div>
        {payments.isPending ? <Skeleton className="mt-4 h-40 rounded-xl" /> : payments.isError ? <ContentState error title="Payments aren’t available." description="We couldn’t load the payment list." action={payments.refetch} /> : (
          <>
            <p className={"mt-4 rounded-lg p-3 text-sm " + (payments.data.meta.unreconciledCount ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-800")}>{payments.data.meta.unreconciledCount ? `${payments.data.meta.unreconciledCount} paid payment(s) have no ledger entry.` : "All paid payments are in the ledger."}</p>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="px-3 py-2">Date</th><th className="px-3 py-2">Payer</th><th className="px-3 py-2">Purpose</th><th className="px-3 py-2">Status</th><th className="px-3 py-2 text-right">Amount</th><th className="px-3 py-2">Ledger</th></tr></thead>
                <tbody className="divide-y divide-border">{payments.data.data.map((p) => <tr key={p.id}><td className="whitespace-nowrap px-3 py-2">{new Date(p.paidAt || p.createdAt).toLocaleDateString("en-IN")}</td><td className="px-3 py-2">{p.payer}</td><td className="px-3 py-2">{p.purpose.replace("_ORDER", "").toLowerCase()}</td><td className="px-3 py-2">{p.status.toLowerCase()}</td><td className="px-3 py-2 text-right font-mono">{money(p.amountPaise)}</td><td className="px-3 py-2">{p.reconciled ? <span className="text-emerald-700">{p.ledgerEntryId ? "Matched" : "—"}</span> : <span className="font-semibold text-red-700">Missing</span>}</td></tr>)}</tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
