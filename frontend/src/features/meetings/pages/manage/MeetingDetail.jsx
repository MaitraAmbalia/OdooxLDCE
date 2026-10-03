import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContentState } from "@/components/common/ContentState";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";

function normalizeAgenda(agenda) {
  if (Array.isArray(agenda)) return agenda;
  if (typeof agenda !== "string") return [];
  return agenda.split("\n").map((topic, index) => ({ id: String(index), topic: topic.trim() })).filter((item) => item.topic);
}

function responseStatus(invite) {
  return invite.rsvp || invite.status || "PENDING";
}

function responseClasses(status) {
  if (status === "YES") return "bg-emerald-100 text-emerald-800";
  if (status === "NO") return "bg-red-100 text-red-800";
  return "bg-amber-100 text-amber-800";
}

export default function MeetingDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("AGENDA");

  const { data: meetingsData, isPending, isError, refetch } = useQuery({
    queryKey: ["meetings"],
    queryFn: async () => {
      const response = await fetch("/api/v1/meetings", { credentials: "include" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error?.message || "Failed to fetch meetings");
      return json;
    },
  });

  const meeting = meetingsData?.data?.find((entry) => entry.id === id);
  usePageTitle(meeting?.title || "Meeting details");

  if (isPending) {
    return <div className="page-container max-w-5xl py-12" role="status" aria-label="Loading meeting"><Skeleton className="h-8 w-44" /><Skeleton className="mt-7 h-32 rounded-2xl" /><Skeleton className="mt-6 h-80 rounded-2xl" /></div>;
  }

  if (isError) {
    return <div className="page-container py-16"><ContentState error title="This meeting isn’t available right now." description="We couldn’t load the meeting schedule." action={refetch} /></div>;
  }

  if (!meeting) {
    return <div className="page-container py-16"><ContentState title="Meeting not found." description="It may have been removed or is no longer visible to your account." actionLabel="Back to meetings" action={() => window.location.assign("/manage/meetings")} /></div>;
  }

  const scheduledAt = meeting.date || meeting.scheduledAt;
  const agenda = normalizeAgenda(meeting.agenda);
  const invites = meeting.rsvps || meeting.invites || [];
  const counts = {
    yes: invites.filter((invite) => responseStatus(invite) === "YES").length,
    no: invites.filter((invite) => responseStatus(invite) === "NO").length,
    pending: invites.filter((invite) => responseStatus(invite) === "PENDING").length,
  };

  return (
    <div className="page-container max-w-5xl py-12 sm:py-16">
      <Button asChild variant="ghost" className="mb-6 -ml-3">
        <Link to="/manage/meetings"><ArrowLeft aria-hidden="true" /> Back to meetings</Link>
      </Button>

      <div className="rounded-2xl border border-border bg-card p-5 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium text-primary">Meeting brief</p>
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{meeting.title}</h1>
          </div>
          <span className="w-fit rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold">{meeting.audience || meeting.audienceType || "BOTH"}</span>
        </div>
        <div className="mt-6 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
          <p className="flex items-center gap-2"><CalendarDays className="size-4 text-primary" aria-hidden="true" />{scheduledAt ? new Date(scheduledAt).toLocaleString(undefined, { dateStyle: "long", timeStyle: "short" }) : "Date to be confirmed"}</p>
          <p className="flex items-center gap-2"><MapPin className="size-4 text-primary" aria-hidden="true" />{meeting.venue || meeting.location || "Venue to be confirmed"}</p>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex border-b border-border bg-secondary/30" role="tablist" aria-label="Meeting information">
          <button type="button" role="tab" aria-selected={activeTab === "AGENDA"} onClick={() => setActiveTab("AGENDA")} className={"border-b-2 px-5 py-4 text-sm font-semibold transition-colors " + (activeTab === "AGENDA" ? "border-primary bg-card text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>Agenda</button>
          <button type="button" role="tab" aria-selected={activeTab === "INVITES"} onClick={() => setActiveTab("INVITES")} className={"border-b-2 px-5 py-4 text-sm font-semibold transition-colors " + (activeTab === "INVITES" ? "border-primary bg-card text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>Invite responses</button>
        </div>

        <div className="p-5 sm:p-7">
          {activeTab === "AGENDA" && (
            <div role="tabpanel">
              <h2 className="font-display text-xl font-semibold">Meeting agenda</h2>
              <p className="mt-1 text-sm text-muted-foreground">The planned talking points for this session.</p>
              {agenda.length === 0 ? (
                <div className="mt-6 rounded-xl border border-dashed border-border px-5 py-10 text-center text-sm text-muted-foreground">No agenda has been added.</div>
              ) : (
                <ol className="mt-6 space-y-3">
                  {agenda.map((item, index) => (
                    <li key={item.id || index} className="flex items-start gap-4 rounded-xl border border-border bg-secondary/20 p-4">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{index + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{item.topic || item.title || String(item)}</p>
                        {(item.owner || item.minutes) && <p className="mt-1 text-xs text-muted-foreground">{item.owner || "Shared discussion"}{item.minutes ? " · " + item.minutes + " minutes" : ""}</p>}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}

          {activeTab === "INVITES" && (
            <div role="tabpanel">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div><h2 className="font-display text-xl font-semibold">Invite responses</h2><p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground"><Users className="size-4" aria-hidden="true" />{invites.length} invited</p></div>
                <div className="flex flex-wrap gap-2 text-xs font-medium"><span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-800">{counts.yes} attending</span><span className="rounded-full bg-red-100 px-2.5 py-1 text-red-800">{counts.no} declined</span><span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-800">{counts.pending} pending</span></div>
              </div>

              {invites.length === 0 ? (
                <div className="mt-6 rounded-xl border border-dashed border-border px-5 py-10 text-center text-sm text-muted-foreground">No invite responses are available yet.</div>
              ) : (
                <div className="mt-6 overflow-x-auto rounded-xl border border-border">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-secondary/40"><tr><th scope="col" className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider">Invitee</th><th scope="col" className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider">Role</th><th scope="col" className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider">Response</th></tr></thead>
                    <tbody className="divide-y divide-border">
                      {invites.map((invite, index) => {
                        const status = responseStatus(invite);
                        return <tr key={invite.id || index}><td className="px-5 py-4 text-sm font-medium">{invite.user?.name || invite.name || invite.role || "Invitee"}</td><td className="px-5 py-4 text-sm text-muted-foreground">{invite.role || "Member"}</td><td className="px-5 py-4 text-right"><span className={"inline-flex rounded-full px-2.5 py-1 text-xs font-semibold " + responseClasses(status)}>{status === "YES" ? "Attending" : status === "NO" ? "Declined" : "Pending"}</span></td></tr>;
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
