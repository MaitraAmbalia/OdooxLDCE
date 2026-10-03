import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, MapPin, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContentState } from "@/components/common/ContentState";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";

function getRsvpSummary(meeting) {
  if (meeting.rsvpCounts) {
    return { attending: meeting.rsvpCounts.yes || 0, total: meeting.rsvpCounts.total || 0 };
  }

  const invites = meeting.invites || [];
  return {
    attending: invites.filter((invite) => (invite.rsvp || invite.status) === "YES").length,
    total: invites.length,
  };
}

export default function MeetingList() {
  usePageTitle("Meetings");
  const { data: meetingsData, isPending, isError, refetch } = useQuery({
    queryKey: ["meetings"],
    queryFn: async () => {
      const response = await fetch("/api/v1/meetings", { credentials: "include" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error?.message || "Failed to fetch meetings");
      return json;
    },
  });

  const meetings = meetingsData?.data || [];

  return (
    <div className="page-container py-12 sm:py-16">
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-medium text-primary">Association operations</p>
          <h1 className="font-display text-4xl font-semibold tracking-tight">Meetings</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Schedule working sessions, share an agenda, and track invite responses.</p>
        </div>
        <Button asChild size="lg" className="w-full sm:w-auto"><Link to="/manage/meetings/new"><Plus aria-hidden="true" /> Schedule meeting</Link></Button>
      </div>

      {isPending ? (
        <div className="space-y-4" role="status" aria-label="Loading meetings"><Skeleton className="h-20 rounded-2xl" /><Skeleton className="h-20 rounded-2xl" /><Skeleton className="h-20 rounded-2xl" /></div>
      ) : isError ? (
        <ContentState error title="Meetings aren’t available right now." description="We couldn’t load the schedule. Try again in a moment." action={refetch} />
      ) : meetings.length === 0 ? (
        <ContentState title="No meetings are scheduled." description="Create a meeting to start coordinating an agenda and invite responses." actionLabel="Schedule meeting" action={() => window.location.assign("/manage/meetings/new")} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="divide-y divide-border md:hidden">
            {meetings.map((meeting) => {
              const scheduledAt = meeting.date || meeting.scheduledAt;
              const rsvps = getRsvpSummary(meeting);
              return (
                <Link key={meeting.id} to={`/manage/meetings/${meeting.id}`} className="block p-5 transition-colors hover:bg-secondary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
                  <div className="flex items-start justify-between gap-4">
                    <div><h2 className="font-display text-lg font-semibold">{meeting.title}</h2><p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><CalendarDays className="size-4" aria-hidden="true" />{scheduledAt ? new Date(scheduledAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "Date to be confirmed"}</p><p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="size-4" aria-hidden="true" />{meeting.venue || meeting.location || "Venue to be confirmed"}</p></div>
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium">{meeting.audience || meeting.audienceType || "BOTH"}</span>
                  </div>
                  <p className="mt-4 flex items-center gap-2 text-xs font-medium text-muted-foreground"><Users className="size-4" aria-hidden="true" />{rsvps.attending} attending · {rsvps.total} invited</p>
                </Link>
              );
            })}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-secondary/40"><tr><th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Date and time</th><th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Meeting</th><th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Audience</th><th scope="col" className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider">Responses</th></tr></thead>
              <tbody className="divide-y divide-border">
                {meetings.map((meeting) => {
                  const scheduledAt = meeting.date || meeting.scheduledAt;
                  const rsvps = getRsvpSummary(meeting);
                  return (
                    <tr key={meeting.id} className="transition-colors hover:bg-secondary/30">
                      <td className="whitespace-nowrap px-6 py-4 text-sm"><p className="font-medium">{scheduledAt ? new Date(scheduledAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "To be confirmed"}</p>{scheduledAt && <p className="mt-1 text-xs text-muted-foreground">{new Date(scheduledAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</p>}</td>
                      <td className="px-6 py-4"><Link to={`/manage/meetings/${meeting.id}`} className="font-medium text-primary underline-offset-4 hover:underline">{meeting.title}</Link><p className="mt-1 text-xs text-muted-foreground">{meeting.venue || meeting.location || "Venue to be confirmed"}</p></td>
                      <td className="whitespace-nowrap px-6 py-4"><span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium">{meeting.audience || meeting.audienceType || "BOTH"}</span></td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm tabular-nums"><span className="font-semibold text-primary">{rsvps.attending}</span><span className="text-muted-foreground"> / {rsvps.total}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
