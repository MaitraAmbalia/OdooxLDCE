import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BellRing } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ContentState } from "@/components/common/ContentState";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useSession } from "@/hooks/useSession";
import { getJson, sendJson } from "@/lib/api";

const date = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—");

function MemberTable({ title, description, query, dateLabel, dateKey }) {
  const { data, isPending, isError, refetch } = useQuery({ queryKey: ["memberships", query], queryFn: () => getJson(`/memberships?limit=100&${query}`) });
  const rows = data?.data || [];
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="font-display text-xl font-semibold">{title} <span className="text-muted-foreground">({data?.meta?.total ?? "…"})</span></h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      {isPending ? <Skeleton className="mt-4 h-24 rounded-xl" /> : isError ? <ContentState error title="Couldn’t load members." description="Please try again." action={refetch} /> : rows.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">Nobody here right now.</p> : (
        <table className="mt-4 min-w-full divide-y divide-border text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="py-2 pr-3">Member</th><th className="py-2 pr-3">Tier</th><th className="py-2">{dateLabel}</th></tr></thead>
          <tbody className="divide-y divide-border">{rows.map((m) => <tr key={m.id}><td className="py-2 pr-3"><span className="font-medium">{m.name}</span> <span className="text-muted-foreground">· {m.studentId}</span></td><td className="py-2 pr-3">{m.tierName}</td><td className="py-2">{date(m[dateKey])}</td></tr>)}</tbody>
        </table>
      )}
    </section>
  );
}

export default function MembershipDues() {
  usePageTitle("Membership dues");
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const canRemind = session?.data?.permissions?.includes("membership.remind");
  const stats = useQuery({ queryKey: ["memberships", "stats"], queryFn: () => getJson("/memberships/stats") });
  const remind = useMutation({
    mutationFn: () => sendJson("/memberships/remind-expiring", { body: { withinDays: 30 } }),
    onSuccess: ({ data }) => {
      queryClient.invalidateQueries({ queryKey: ["memberships"] });
      toast.success(data.reminded ? `Reminders sent to ${data.reminded} member${data.reminded === 1 ? "" : "s"}.` : "Nobody needed a reminder.", {
        description: data.skippedRecentlyReminded ? `${data.skippedRecentlyReminded} were already reminded this week.` : undefined,
      });
    },
    onError: (error) => toast.error(error.message),
  });
  const s = stats.data?.data;

  return (
    <div className="page-container py-12 sm:py-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="mb-2 text-sm font-medium text-primary">Treasurer</p><h1 className="font-display text-4xl font-semibold tracking-tight">Membership dues</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Track unpaid sign-ups and memberships about to lapse, and send renewal reminders (in-app and by email).</p></div>
        {canRemind && <Button onClick={() => remind.mutate()} disabled={remind.isPending}><BellRing aria-hidden="true" /> {remind.isPending ? "Sending…" : "Send renewal reminders"}</Button>}
      </div>
      {s && (
        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          {[["Active", s.active], ["Pending dues", s.pending], ["Due in 30 days", s.renewalsDue30d], ["Lapsed", s.lapsed]].map(([label, value]) => <div key={label} className="rounded-2xl border border-border bg-card p-5"><p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-2 font-display text-3xl font-semibold tabular-nums">{value}</p></div>)}
        </div>
      )}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <MemberTable title="Pending dues" description="Signed up but haven’t paid yet." query="status=PENDING" dateLabel="Signed up" dateKey="createdAt" />
        <MemberTable title="Expiring within 30 days" description="Active memberships that need renewing soon." query="status=ACTIVE&expiringWithinDays=30" dateLabel="Expires" dateKey="expiresAt" />
      </div>
    </div>
  );
}
