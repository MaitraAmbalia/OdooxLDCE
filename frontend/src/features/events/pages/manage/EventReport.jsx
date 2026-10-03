import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ContentState } from "@/components/common/ContentState";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useSession } from "@/hooks/useSession";
import { getJson, sendJson } from "@/lib/api";
import { formatINR } from "@/lib/utils";

const inr = (paise) => formatINR(paise ?? 0, true);

function Stat({ label, value, hint }) {
  return <div className="rounded-2xl border border-border bg-card p-5"><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-2 font-display text-3xl font-semibold tabular-nums">{value}</p>{hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}</div>;
}

export default function EventReport() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const permissions = session?.data?.permissions || [];
  const canStaffDoor = permissions.includes("event.door.assign");
  const [volunteerId, setVolunteerId] = useState("");
  const [capacity, setCapacity] = useState("");

  const report = useQuery({ queryKey: ["events", id, "report"], queryFn: () => getJson(`/events/${id}/report`) });
  const staff = useQuery({ queryKey: ["events", id, "door-staff"], queryFn: () => getJson(`/events/${id}/door-staff`), enabled: canStaffDoor });
  const volunteers = useQuery({ queryKey: ["volunteers"], queryFn: () => getJson("/volunteers"), enabled: canStaffDoor });
  const r = report.data?.data;
  usePageTitle(r ? `Report · ${r.event.title}` : "Event report");

  const onError = (error) => toast.error(error.message);
  const addStaff = useMutation({
    mutationFn: () => sendJson(`/events/${id}/door-staff`, { body: { userId: volunteerId } }),
    onSuccess: () => { setVolunteerId(""); queryClient.invalidateQueries({ queryKey: ["events", id, "door-staff"] }); toast.success("Door access granted."); },
    onError,
  });
  const removeStaff = useMutation({
    mutationFn: (userId) => sendJson(`/events/${id}/door-staff/${userId}`, { method: "DELETE" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["events", id, "door-staff"] }); toast.success("Door access removed."); },
    onError,
  });
  const saveCapacity = useMutation({
    mutationFn: () => sendJson(`/events/${id}`, { method: "PATCH", body: { capacity: Number(capacity) } }),
    onSuccess: () => { setCapacity(""); queryClient.invalidateQueries({ queryKey: ["events"] }); toast.success("Capacity updated."); },
    onError,
  });

  if (report.isPending) return <div className="page-container py-12" role="status" aria-label="Loading report"><Skeleton className="h-10 w-72" /><Skeleton className="mt-8 h-64 rounded-2xl" /></div>;
  if (report.isError || !r) return <div className="page-container py-16"><ContentState error title="This report isn’t available." description="The event may not exist, or your role can’t view its analytics." action={report.refetch} /></div>;

  const staffIds = new Set((staff.data?.data || []).map((s) => s.id));
  const available = (volunteers.data?.data || []).filter((v) => v.status === "ACTIVE" && !staffIds.has(v.userId));
  const { totals, budget } = r;

  return (
    <div className="page-container py-12 sm:py-16">
      <Button asChild variant="ghost" className="mb-6 -ml-3"><Link to="/manage/events"><ArrowLeft aria-hidden="true" /> Event console</Link></Button>
      <p className="mb-2 text-sm font-medium text-primary">Event analytics</p>
      <h1 className="font-display text-4xl font-semibold tracking-tight">{r.event.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{new Date(r.event.startAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })} · {r.event.venue} · {r.event.status.replaceAll("_", " ")}</p>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Attendance">
        <Stat label="Tickets sold" value={`${totals.sold} / ${totals.capacity}`} hint={`${Math.round((totals.sold / totals.capacity) * 100)}% of capacity`} />
        <Stat label="Checked in" value={totals.checkedIn} hint={`${Math.round(totals.checkInRate * 100)}% of tickets sold`} />
        <Stat label="No-shows" value={totals.noShows ?? "—"} hint={totals.noShows == null ? "Counted after the event ends" : undefined} />
        <Stat label="Ticket revenue" value={inr(totals.revenuePaise)} />
      </section>

      <section className="mt-10" aria-labelledby="types-heading">
        <h2 id="types-heading" className="font-display text-2xl font-semibold">Sold vs checked in, by ticket type</h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wider"><tr><th className="px-4 py-3">Ticket</th><th className="px-4 py-3">Audience</th><th className="px-4 py-3 text-right">Price</th><th className="px-4 py-3 text-right">Sold / quota</th><th className="px-4 py-3 text-right">Checked in</th><th className="px-4 py-3 text-right">Revenue</th></tr></thead>
            <tbody className="divide-y divide-border">{r.ticketTypes.map((t) => <tr key={t.id}><td className="px-4 py-3 font-medium">{t.name}</td><td className="px-4 py-3">{t.audience.replaceAll("_", " ")}</td><td className="px-4 py-3 text-right font-mono">{inr(t.pricePaise)}</td><td className="px-4 py-3 text-right tabular-nums">{t.sold} / {t.quota}</td><td className="px-4 py-3 text-right tabular-nums">{t.checkedIn}</td><td className="px-4 py-3 text-right font-mono">{inr(t.revenuePaise)}</td></tr>)}</tbody>
          </table>
        </div>
      </section>

      <section className="mt-10" aria-labelledby="budget-heading">
        <h2 id="budget-heading" className="font-display text-2xl font-semibold">Budget</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Stat label="Requested" value={inr(budget.requestedPaise)} />
          <Stat label="Approved" value={budget.approvedPaise == null ? "Not set" : inr(budget.approvedPaise)} />
          <Stat label="Spent" value={inr(budget.spentPaise)} hint="Paid claims and expenses" />
          <Stat label="Committed" value={inr(budget.committedPaise)} hint={`Approved, not yet paid · ${inr(budget.pendingClaimsPaise)} awaiting review`} />
          <Stat label="Remaining" value={budget.remainingPaise == null ? "—" : inr(budget.remainingPaise)} />
        </div>
        {budget.lines.length > 0 && <ul className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card text-sm">{budget.lines.map((line) => <li key={line.id} className="flex justify-between gap-4 px-4 py-3"><span>{line.category}{line.note && <span className="text-muted-foreground"> · {line.note}</span>}</span><span className="font-mono">{inr(line.amountPaise)}</span></li>)}</ul>}
      </section>

      {r.event.status === "PUBLISHED" && permissions.includes("event.propose") && (
        <section className="mt-10 rounded-2xl border border-border bg-card p-5" aria-labelledby="capacity-heading">
          <h2 id="capacity-heading" className="font-display text-xl font-semibold">Venue capacity</h2>
          <p className="mt-1 text-sm text-muted-foreground">Currently {totals.capacity}. It can't go below the {totals.sold} seats already sold.</p>
          <form className="mt-4 flex max-w-sm gap-2" onSubmit={(e) => { e.preventDefault(); saveCapacity.mutate(); }}>
            <label htmlFor="capacity" className="sr-only">New capacity</label>
            <Input id="capacity" type="number" min={Math.max(1, totals.sold)} value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="New capacity" />
            <Button type="submit" disabled={!capacity || saveCapacity.isPending}>Save</Button>
          </form>
        </section>
      )}

      {canStaffDoor && (
        <section className="mt-10 rounded-2xl border border-border bg-card p-5" aria-labelledby="door-heading">
          <h2 id="door-heading" className="font-display text-xl font-semibold">Door staff</h2>
          <p className="mt-1 text-sm text-muted-foreground">Volunteers listed here can scan tickets and verify memberships for this event, from 6 hours before it starts until 6 hours after it ends.</p>
          <ul className="mt-4 divide-y divide-border rounded-xl border border-border">
            {(staff.data?.data || []).length === 0 && <li className="p-3 text-sm text-muted-foreground">No volunteers assigned yet.</li>}
            {(staff.data?.data || []).map((s) => <li key={s.id} className="flex items-center justify-between gap-3 p-3 text-sm"><span><span className="font-medium">{s.name}</span> <span className="text-muted-foreground">· {s.studentId}</span></span><Button variant="ghost" size="icon-sm" aria-label={`Remove ${s.name}`} onClick={() => removeStaff.mutate(s.id)}><Trash2 aria-hidden="true" /></Button></li>)}
          </ul>
          {r.event.status === "PUBLISHED" && <form className="mt-4 flex flex-col gap-2 sm:flex-row" onSubmit={(e) => { e.preventDefault(); addStaff.mutate(); }}>
            <label htmlFor="volunteer" className="sr-only">Volunteer</label>
            <select id="volunteer" value={volunteerId} onChange={(e) => setVolunteerId(e.target.value)} className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Choose a volunteer…</option>
              {available.map((v) => <option key={v.userId} value={v.userId}>{v.user?.name} ({v.user?.studentId})</option>)}
            </select>
            <Button type="submit" disabled={!volunteerId || addStaff.isPending}><UserPlus aria-hidden="true" /> Give door access</Button>
          </form>}
        </section>
      )}
    </div>
  );
}
