import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, HandCoins, Mail, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ContentState } from "@/components/common/ContentState";
import { Skeleton } from "@/components/ui/skeleton";
import { formatINR } from "@/lib/utils";
import { usePageTitle } from "@/hooks/usePageTitle";

async function api(path, options) {
  const response = await fetch(path, { credentials: "include", ...options });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(json.error?.message || "The request could not be completed");
  return json.data;
}

const money = (paise = 0) => formatINR(Number(paise) / 100);

export default function SponsorshipWorkspace() {
  usePageTitle("Sponsorship CRM");
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [selectedEventId, setSelectedEventId] = useState(searchParams.get("event") || "");
  const [createdOpportunity, setCreatedOpportunity] = useState(null);
  const [prospect, setProspect] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    packageName: "",
    expectedAmount: "",
    note: "",
  });
  const [receiptLead, setReceiptLead] = useState(null);
  const [receipt, setReceipt] = useState({ amount: "", receivedAt: new Date().toISOString().slice(0, 10), paymentReference: "", note: "" });

  const authQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => api("/api/v1/auth/me"),
    retry: false,
  });
  const eventsQuery = useQuery({
    queryKey: ["sponsorship", "events"],
    queryFn: () => api("/api/v1/sponsorship/events"),
  });
  const healthQuery = useQuery({
    queryKey: ["odoo", "health"],
    queryFn: () => api("/api/v1/integrations/odoo/health"),
    retry: false,
  });

  const events = eventsQuery.data || [];
  const selectedEvent = useMemo(() => events.find((event) => event.id === selectedEventId), [events, selectedEventId]);
  const canManage = authQuery.data?.permissions?.includes("sponsorship.crm.manage");
  const canRecordReceipt = authQuery.data?.permissions?.includes("sponsorship.receipt.record");
  const odooWebUrl = healthQuery.data?.webUrl;

  useEffect(() => {
    if (!selectedEventId && events[0]) setSelectedEventId(events[0].id);
  }, [events, selectedEventId]);

  useEffect(() => {
    if (selectedEvent?.sponsorshipPackages?.length && !selectedEvent.sponsorshipPackages.includes(prospect.packageName)) {
      setProspect((current) => ({ ...current, packageName: selectedEvent.sponsorshipPackages[0] }));
    }
  }, [selectedEvent, prospect.packageName]);

  const summaryQuery = useQuery({
    queryKey: ["odoo", "sponsorship-summary", selectedEventId],
    queryFn: () => api(`/api/v1/events/${selectedEventId}/odoo-sponsorship-summary`),
    enabled: Boolean(selectedEventId && healthQuery.isSuccess),
    retry: false,
  });

  const createOpportunity = useMutation({
    mutationFn: () => api(`/api/v1/events/${selectedEventId}/odoo-opportunities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyName: prospect.companyName,
        contactName: prospect.contactName,
        email: prospect.email,
        phone: prospect.phone,
        packageName: prospect.packageName,
        expectedAmountPaise: Math.round(Number(prospect.expectedAmount) * 100),
        note: prospect.note,
      }),
    }),
    onSuccess: (data) => {
      setCreatedOpportunity(data);
      setProspect((current) => ({ ...current, companyName: "", contactName: "", email: "", phone: "", expectedAmount: "", note: "" }));
      queryClient.invalidateQueries({ queryKey: ["odoo", "sponsorship-summary", selectedEventId] });
      toast.success("Opportunity created in Odoo CRM.");
    },
    onError: (error) => toast.error(error.message),
  });

  const recordReceipt = useMutation({
    mutationFn: () => api(`/api/v1/events/${selectedEventId}/odoo-opportunities/${receiptLead.id}/receipts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amountReceivedPaise: Math.round(Number(receipt.amount) * 100),
        receivedAt: new Date(`${receipt.receivedAt}T12:00:00+05:30`).toISOString(),
        paymentReference: receipt.paymentReference,
        note: receipt.note,
      }),
    }),
    onSuccess: (data) => {
      toast.success(data.duplicate ? "This payment was already recorded." : "Sponsorship payment recorded in the ledger.");
      setReceiptLead(null);
      setReceipt({ amount: "", receivedAt: new Date().toISOString().slice(0, 10), paymentReference: "", note: "" });
      queryClient.invalidateQueries({ queryKey: ["odoo", "sponsorship-summary", selectedEventId] });
      queryClient.invalidateQueries({ queryKey: ["finance"] });
    },
    onError: (error) => toast.error(error.message),
  });

  const submitProspect = (event) => {
    event.preventDefault();
    if (!selectedEventId) return toast.error("Select an event first.");
    if (!prospect.companyName || !prospect.contactName || !prospect.email || !prospect.packageName || Number(prospect.expectedAmount) <= 0) {
      return toast.error("Complete the required sponsor fields.");
    }
    createOpportunity.mutate();
  };

  const openReceipt = (lead) => {
    setReceiptLead(lead);
    setReceipt((current) => ({ ...current, amount: (lead.remainingAmountPaise / 100).toFixed(2) }));
  };

  if (eventsQuery.isPending) {
    return <div className="page-container py-12"><Skeleton className="h-10 w-72" /><Skeleton className="mt-8 h-96 rounded-2xl" /></div>;
  }
  if (eventsQuery.isError) {
    return <div className="page-container py-16"><ContentState error title="Sponsorship workspace is unavailable." description={eventsQuery.error.message} action={eventsQuery.refetch} /></div>;
  }

  return (
    <div className="page-container py-12 sm:py-16">
      <Button asChild variant="ghost" className="mb-6 -ml-3"><Link to="/manage"><ArrowLeft aria-hidden="true" /> Back to manage</Link></Button>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="mb-2 text-sm font-medium text-primary">Odoo CRM integration</p><h1 className="font-display text-4xl font-semibold tracking-tight">Sponsorship workspace</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Select an approved event, create sponsor opportunities in Odoo, and reconcile Won commitments with money received by Skyline.</p></div>
        <div className="flex flex-col items-start gap-2 lg:items-end">
          <div className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${healthQuery.isSuccess ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-800"}`}>{healthQuery.isPending ? "Checking Odoo…" : healthQuery.isSuccess ? "Odoo connected" : "Odoo unavailable"}</div>
          {odooWebUrl && <Button asChild variant="outline" size="sm"><a href={odooWebUrl} target="_blank" rel="noreferrer">Open Odoo and sign in <ExternalLink className="size-4" /></a></Button>}
          {odooWebUrl && <p className="max-w-xs text-left text-xs text-muted-foreground lg:text-right">Sign in once before the demo. Opportunity links will reuse the saved Odoo browser session.</p>}
        </div>
      </div>

      {events.length === 0 ? <div className="mt-10"><ContentState title="No events need sponsorship." description="Approved events marked as requiring sponsorship will appear here." /></div> : <>
        <section className="mt-10 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <label htmlFor="sponsorship-event" className="text-sm font-semibold">Selected event</label>
          <select id="sponsorship-event" value={selectedEventId} onChange={(event) => { setSelectedEventId(event.target.value); setCreatedOpportunity(null); }} className="mt-2 h-11 w-full rounded-md border border-input bg-background px-3 text-sm">
            {events.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}
          </select>
          {selectedEvent && <div className="mt-5 grid gap-4 rounded-xl bg-secondary/35 p-4 text-sm sm:grid-cols-3"><div><p className="text-xs text-muted-foreground">Target</p><p className="mt-1 font-semibold">{money(selectedEvent.sponsorshipTargetPaise)}</p></div><div><p className="text-xs text-muted-foreground">Deadline</p><p className="mt-1 font-semibold">{new Date(selectedEvent.sponsorshipDeadline).toLocaleDateString("en-IN")}</p></div><div><p className="text-xs text-muted-foreground">Event date</p><p className="mt-1 font-semibold">{new Date(selectedEvent.startAt).toLocaleDateString("en-IN")}</p></div><div className="sm:col-span-3"><p className="text-xs text-muted-foreground">Pitch</p><p className="mt-1 leading-6">{selectedEvent.sponsorshipPitch}</p></div></div>}
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <div className="flex items-center gap-3"><span className="rounded-xl bg-primary/10 p-2 text-primary"><HandCoins className="size-5" /></span><div><h2 className="font-display text-xl font-semibold">Add prospective sponsor</h2><p className="text-xs text-muted-foreground">The submitted contact is stored only in Odoo.</p></div></div>
            {!canManage ? <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Only the Sponsorship Head or President can create CRM opportunities.</p> : <form onSubmit={submitProspect} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-2 block text-xs font-medium">Company</label><Input value={prospect.companyName} onChange={(e) => setProspect({ ...prospect, companyName: e.target.value })} /></div><div><label className="mb-2 block text-xs font-medium">Contact person</label><Input value={prospect.contactName} onChange={(e) => setProspect({ ...prospect, contactName: e.target.value })} /></div></div>
              <div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-2 block text-xs font-medium">Email</label><Input type="email" value={prospect.email} onChange={(e) => setProspect({ ...prospect, email: e.target.value })} /></div><div><label className="mb-2 block text-xs font-medium">Phone</label><Input value={prospect.phone} onChange={(e) => setProspect({ ...prospect, phone: e.target.value })} /></div></div>
              <div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-2 block text-xs font-medium">Package</label><select value={prospect.packageName} onChange={(e) => setProspect({ ...prospect, packageName: e.target.value })} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">{(selectedEvent?.sponsorshipPackages || []).map((name) => <option key={name}>{name}</option>)}</select></div><div><label className="mb-2 block text-xs font-medium">Expected amount (₹)</label><Input type="number" min="1" step="0.01" value={prospect.expectedAmount} onChange={(e) => setProspect({ ...prospect, expectedAmount: e.target.value })} /></div></div>
              <div><label className="mb-2 block text-xs font-medium">Initial note</label><textarea rows={3} value={prospect.note} onChange={(e) => setProspect({ ...prospect, note: e.target.value })} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm" /></div>
              <Button type="submit" disabled={createOpportunity.isPending || healthQuery.isError}>{createOpportunity.isPending ? "Creating in Odoo…" : "Create Odoo opportunity"}</Button>
              {createdOpportunity && <a href={createdOpportunity.odooUrl} target="_blank" rel="noreferrer" className="ml-3 inline-flex min-h-9 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium hover:bg-secondary">Open opportunity in Odoo <ExternalLink className="size-4" /></a>}
            </form>}
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <div className="flex items-center justify-between"><div><h2 className="font-display text-xl font-semibold">Live Odoo position</h2><p className="mt-1 text-xs text-muted-foreground">Read live; no CRM records are copied into Skyline.</p></div><Button variant="ghost" size="icon-sm" aria-label="Refresh Odoo summary" onClick={() => summaryQuery.refetch()}><RefreshCw className="size-4" /></Button></div>
            {healthQuery.isError ? <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">{healthQuery.error.message}. Event operations continue normally while CRM is unavailable.</p> : summaryQuery.isPending ? <Skeleton className="mt-6 h-48 rounded-xl" /> : summaryQuery.isError ? <p className="mt-6 text-sm text-destructive">{summaryQuery.error.message}</p> : summaryQuery.data && <div className="mt-6">
              <div className="grid grid-cols-2 gap-3 text-sm"><div className="rounded-xl bg-secondary/40 p-3"><p className="text-xs text-muted-foreground">Open pipeline</p><p className="mt-1 font-semibold">{money(summaryQuery.data.openPipelinePaise)}</p></div><div className="rounded-xl bg-secondary/40 p-3"><p className="text-xs text-muted-foreground">Won commitments</p><p className="mt-1 font-semibold">{money(summaryQuery.data.wonCommitmentsPaise)}</p></div><div className="rounded-xl bg-secondary/40 p-3"><p className="text-xs text-muted-foreground">Received</p><p className="mt-1 font-semibold text-emerald-700">{money(summaryQuery.data.receivedPaise)}</p></div><div className="rounded-xl bg-secondary/40 p-3"><p className="text-xs text-muted-foreground">Overdue follow-ups</p><p className="mt-1 font-semibold">{summaryQuery.data.overdueActivities}</p></div></div>
              <div className="mt-5 space-y-3"><h3 className="text-sm font-semibold">Won sponsorships</h3>{summaryQuery.data.won.length === 0 ? <p className="text-sm text-muted-foreground">No Won opportunities yet.</p> : summaryQuery.data.won.map((lead) => <div key={lead.id} className="rounded-xl border border-border p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-semibold">{lead.sponsor}</p><p className="mt-1 text-xs text-muted-foreground">Committed {money(lead.expectedAmountPaise)} · Received {money(lead.receivedAmountPaise)}</p><p className="mt-2 text-xs font-semibold uppercase tracking-wide text-primary">{lead.paymentStatus.replaceAll("_", " ")}</p></div><div className="flex gap-2"><a href={lead.odooUrl} target="_blank" rel="noreferrer" className="inline-flex size-9 items-center justify-center rounded-md border border-border hover:bg-secondary" aria-label="Open in Odoo"><ExternalLink className="size-4" /></a>{canRecordReceipt && lead.remainingAmountPaise > 0 && <Button size="sm" onClick={() => openReceipt(lead)}>Record payment</Button>}</div></div></div>)}</div>
            </div>}
          </section>
        </div>
      </>}

      {receiptLead && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="receipt-title"><form onSubmit={(event) => { event.preventDefault(); recordReceipt.mutate(); }} className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl"><div className="flex items-center gap-3"><Mail className="size-5 text-primary" /><h2 id="receipt-title" className="font-display text-xl font-semibold">Record sponsor payment</h2></div><p className="mt-2 text-sm text-muted-foreground">{receiptLead.sponsor} has {money(receiptLead.remainingAmountPaise)} remaining on its Won commitment.</p><div className="mt-5 space-y-4"><div><label className="mb-2 block text-xs font-medium">Amount received (₹)</label><Input type="number" min="0.01" step="0.01" max={receiptLead.remainingAmountPaise / 100} value={receipt.amount} onChange={(e) => setReceipt({ ...receipt, amount: e.target.value })} required /></div><div><label className="mb-2 block text-xs font-medium">Received date</label><Input type="date" value={receipt.receivedAt} onChange={(e) => setReceipt({ ...receipt, receivedAt: e.target.value })} required /></div><div><label className="mb-2 block text-xs font-medium">Transaction or receipt reference</label><Input value={receipt.paymentReference} onChange={(e) => setReceipt({ ...receipt, paymentReference: e.target.value })} required /></div><div><label className="mb-2 block text-xs font-medium">Note</label><Input value={receipt.note} onChange={(e) => setReceipt({ ...receipt, note: e.target.value })} /></div></div><div className="mt-6 flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setReceiptLead(null)}>Cancel</Button><Button type="submit" disabled={recordReceipt.isPending}>{recordReceipt.isPending ? "Recording…" : "Confirm received"}</Button></div></form></div>}
    </div>
  );
}
