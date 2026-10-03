import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, MapPin, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ContentState } from "@/components/common/ContentState";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

export default function MentorReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [decision, setDecision] = useState("");
  const [comment, setComment] = useState("");
  const [approvedBudget, setApprovedBudget] = useState(0);

  const { data: authData } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const response = await fetch("/api/v1/auth/me", { credentials: "include" });
      if (!response.ok) return null;
      return response.json();
    },
    retry: false,
  });

  const { data: eventData, isPending, isError, refetch } = useQuery({
    queryKey: ["events", id, "review"],
    queryFn: async () => {
      const response = await fetch("/api/v1/events/" + id, { credentials: "include" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error?.message || "Failed to fetch event proposal");
      return json;
    },
  });

  const event = eventData?.data;
  const user = authData?.data;
  const isMentor = user?.roles?.includes("MENTOR");
  const canReview = event?.status === "PENDING_APPROVAL" || event?.status === "CHANGES_REQUESTED";
  usePageTitle(event?.title ? "Review " + event.title : "Event review");

  useEffect(() => {
    if (event?.approvedBudgetPaise != null) setApprovedBudget(Number(event.approvedBudgetPaise) / 100);
  }, [event?.approvedBudgetPaise]);

  const reviewMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await fetch("/api/v1/events/" + id + "/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error?.message || "Failed to submit review decision");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Review decision recorded.");
      navigate("/manage");
    },
    onError: (error) => toast.error(error.message || "Failed to submit decision."),
  });

  const submitReview = (eventObject) => {
    eventObject.preventDefault();
    if (!decision) return;
    if ((decision === "REQUEST_CHANGES" || decision === "REJECT") && !comment.trim()) {
      toast.error("Feedback is required for this decision.");
      return;
    }
    reviewMutation.mutate({ decision, comment: comment.trim(), approvedBudget: decision === "APPROVE" && approvedBudget > 0 ? approvedBudget : null });
  };

  if (isPending) return <div className="page-container py-12" role="status" aria-label="Loading event review"><Skeleton className="h-8 w-52" /><div className="mt-8 grid gap-6 lg:grid-cols-3"><Skeleton className="h-[34rem] rounded-2xl lg:col-span-2" /><Skeleton className="h-[34rem] rounded-2xl" /></div></div>;
  if (isError || !event) return <div className="page-container py-16"><ContentState error title="This event proposal isn’t available." description="It may have moved or no longer be visible." action={refetch} /></div>;

  const startAt = event.startAt || event.startDate;
  const ticketTypes = event.ticketTypes || [];

  return (
    <div className="page-container py-12 sm:py-16">
      <Button asChild variant="ghost" className="mb-6 -ml-3"><Link to="/manage"><ArrowLeft aria-hidden="true" /> Back to manage</Link></Button>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="mb-2 text-sm font-medium text-primary">Mentor authorization</p><h1 className="font-display text-4xl font-semibold tracking-tight">Review event proposal</h1></div><span className="w-fit rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800">{event.status.replaceAll("_", " ")}</span></div>

      {!isMentor && <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950" role="alert"><strong>Mentor access required.</strong> {user ? "You are signed in without the Mentor role, so this proposal is read-only." : "Sign in with an authorized Mentor account to record a decision."} {!user && <Link to="/login" className="ml-1 font-semibold underline">Go to login</Link>}</div>}
      {!canReview && <div className="mt-6 rounded-xl border border-border bg-secondary/40 p-4 text-sm text-muted-foreground" role="status">This proposal is already {event.status.toLowerCase().replaceAll("_", " ")} and is available as a read-only record.</div>}

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-7" aria-labelledby="proposal-title">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">{event.category || "Event"}</p>
          <h2 id="proposal-title" className="mt-2 font-display text-3xl font-semibold">{event.title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">Proposed by {event.proposedBy?.name || "Event team"}</p>
          <div className="mt-6 grid gap-3 rounded-xl bg-secondary/40 p-4 text-sm sm:grid-cols-3"><p className="flex items-start gap-2"><CalendarDays className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" /><span>{startAt ? new Date(startAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "Schedule unavailable"}</span></p><p className="flex items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" /><span>{event.venue}</span></p><p className="flex items-start gap-2"><Users className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" /><span>{event.capacity} capacity</span></p></div>
          <div className="mt-7"><h3 className="text-sm font-semibold">Description</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{event.description}</p></div>
          <div className="mt-8"><h3 className="text-sm font-semibold">Ticket allocation</h3>{ticketTypes.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">No ticket types were configured.</p> : <div className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border">{ticketTypes.map((ticket) => <div key={ticket.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{ticket.name}</p><p className="mt-1 text-xs text-muted-foreground">{ticket.audience.replaceAll("_", " ")} · Maximum {ticket.maxPerUser} per person</p></div><div className="text-sm sm:text-right"><p className="font-mono font-semibold">{money.format(Number(ticket.pricePaise || 0) / 100)}</p><p className="mt-1 text-xs text-muted-foreground">{ticket.quota} places</p></div></div>)}</div>}</div>
        </section>

        <aside className="h-fit rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-24" aria-labelledby="decision-heading">
          <h2 id="decision-heading" className="font-display text-xl font-semibold">Decision</h2>
          <form onSubmit={submitReview} className="mt-5 space-y-5">
            <fieldset disabled={!isMentor || !canReview || reviewMutation.isPending}><legend className="sr-only">Review decision</legend><div className="space-y-2">{[{ id: "APPROVE", label: "Approve", description: "Publish the event and record authorization." }, { id: "REQUEST_CHANGES", label: "Request changes", description: "Return it to the event team with feedback." }, { id: "REJECT", label: "Reject", description: "Decline this proposal." }].map((option) => <label key={option.id} className={"block cursor-pointer rounded-xl border p-3 transition " + (decision === option.id ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/30")}><span className="flex items-start gap-3"><input type="radio" name="decision" value={option.id} checked={decision === option.id} onChange={() => setDecision(option.id)} className="mt-1 accent-primary" /><span><span className="block text-sm font-medium">{option.label}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{option.description}</span></span></span></label>)}</div></fieldset>

            {decision === "APPROVE" && <div><label htmlFor="approved-budget" className="mb-2 block text-sm font-medium">Approved budget (₹)</label><Input id="approved-budget" type="number" min="0" step="1" value={approvedBudget} onChange={(eventObject) => setApprovedBudget(Number(eventObject.target.value))} /><p className="mt-2 text-xs leading-5 text-muted-foreground">Optional. Leave at zero if no budget is being authorized.</p></div>}
            <div><label htmlFor="mentor-comment" className="mb-2 block text-sm font-medium">Feedback {(decision === "REQUEST_CHANGES" || decision === "REJECT") && <span className="text-destructive">*</span>}</label><textarea id="mentor-comment" rows={4} value={comment} onChange={(eventObject) => setComment(eventObject.target.value)} disabled={!isMentor || !canReview} placeholder="Add clear, actionable feedback…" className="w-full resize-y rounded-xl border border-input bg-background px-3 py-2 text-sm leading-6 outline-none disabled:opacity-50 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50" /></div>
            <Button type="submit" className="w-full" disabled={!decision || !isMentor || !canReview || reviewMutation.isPending}>{reviewMutation.isPending ? "Recording…" : "Submit decision"}</Button>
          </form>
        </aside>
      </div>
    </div>
  );
}
