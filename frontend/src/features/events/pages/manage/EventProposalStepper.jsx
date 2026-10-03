import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useFieldArray, useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePageTitle } from "@/hooks/usePageTitle";
import { getJson, sendJson } from "@/lib/api";
import { formatINR } from "@/lib/utils";
import { categoryLabel } from "../../lib/events";

const CATEGORIES = ["SOCIAL", "WORKSHOP", "HACKATHON", "CONFERENCE", "COMPETITION", "EXHIBITION", "GALA", "SPORTS", "CULTURAL", "ACADEMIC"];
const STEPS = ["Basics", "Schedule", "Tickets", "Budget", "Review"];
// <input type="datetime-local"> wants local "YYYY-MM-DDTHH:mm".
const toLocalInput = (iso) => { const d = new Date(iso); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };

export default function EventProposalStepper() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  usePageTitle(isEdit ? "Edit event proposal" : "Propose an event");
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();
  // From the event calendar: ?date=YYYY-MM-DD pre-fills the schedule.
  const suggestedDate = useSearchParams()[0].get("date");
  const queryClient = useQueryClient();
  const { register, handleSubmit, watch, control, reset, formState: { errors } } = useForm({
    defaultValues: {
      category: "SOCIAL",
      visibility: "PUBLIC",
      capacity: 100,
      startAt: suggestedDate ? `${suggestedDate.slice(0, 10)}T10:00` : "",
      endAt: suggestedDate ? `${suggestedDate.slice(0, 10)}T11:00` : "",
      ticketTypes: [
        { name: "Member", audience: "MEMBER", price: 0, quota: 60, maxPerUser: 2 },
        { name: "Standard", audience: "NON_MEMBER", price: 0, quota: 40, maxPerUser: 2 },
      ],
      budgetLines: [],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "ticketTypes" });
  const budget = useFieldArray({ control, name: "budgetLines" });
  const values = watch();
  const allocatedQuota = (values.ticketTypes || []).reduce((total, ticket) => total + Number(ticket.quota || 0), 0);
  const requestedBudget = (values.budgetLines || []).reduce((total, line) => total + Number(line.amount || 0), 0);

  const existing = useQuery({ queryKey: ["events", id], queryFn: () => getJson("/events/" + id), enabled: isEdit });
  const event = existing.data?.data;
  const latestFeedback = event?.reviews?.filter((r) => r.comment).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  useEffect(() => {
    if (!event) return;
    reset({
      title: event.title, description: event.description, category: event.category?.toUpperCase(), visibility: event.visibility,
      venue: event.venue, capacity: event.capacity, startAt: toLocalInput(event.startAt), endAt: toLocalInput(event.endAt),
      ticketTypes: event.ticketTypes.map((t) => ({ name: t.name, audience: t.audience, price: t.pricePaise / 100, quota: t.quota, maxPerUser: t.maxPerUser })),
      budgetLines: (event.budgetLines || []).map((b) => ({ category: b.category, amount: b.amountPaise / 100, note: b.note || "" })),
    });
  }, [event, reset]);

  const submitEvent = useMutation({
    mutationFn: async (data) => {
      const payload = {
        title: data.title.trim(),
        description: data.description.trim(),
        category: data.category,
        venue: data.venue.trim(),
        startAt: new Date(data.startAt).toISOString(),
        endAt: new Date(data.endAt).toISOString(),
        capacity: Number(data.capacity),
        visibility: data.visibility,
        ticketTypes: (data.ticketTypes || []).map((ticket) => ({
          name: ticket.name.trim(),
          audience: ticket.audience,
          pricePaise: Math.round(Number(ticket.price || 0) * 100),
          quota: Number(ticket.quota),
          maxPerUser: Number(ticket.maxPerUser || 1),
        })),
        budgetLines: (data.budgetLines || []).filter((line) => line.category?.trim() && Number(line.amount) > 0).map((line) => ({
          category: line.category.trim(),
          amountPaise: Math.round(Number(line.amount) * 100),
          ...(line.note?.trim() ? { note: line.note.trim() } : {}),
        })),
      };
      const json = await sendJson(isEdit ? "/events/" + id : "/events", { method: isEdit ? "PATCH" : "POST", body: payload });
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Proposal submitted for mentor review. Tickets go on sale once it is approved.");
      navigate("/manage/events");
    },
    onError: (error) => toast.error(error.message || "Could not create event."),
  });

  const advance = () => setCurrentStep((step) => Math.min(step + 1, STEPS.length));
  const onSubmit = (data) => {
    if (currentStep < STEPS.length) {
      advance();
      return;
    }
    if (new Date(data.endAt) <= new Date(data.startAt)) {
      toast.error("End time must be after the start time.");
      setCurrentStep(2);
      return;
    }
    if (allocatedQuota > Number(data.capacity)) {
      toast.error("Ticket quotas cannot exceed the event capacity.");
      setCurrentStep(3);
      return;
    }
    submitEvent.mutate(data);
  };

  return (
    <div className="page-container max-w-4xl py-12 sm:py-16">
      <Button asChild variant="ghost" className="mb-6 -ml-3"><Link to="/manage/events"><ArrowLeft aria-hidden="true" /> Event console</Link></Button>
      <div><p className="mb-2 text-sm font-medium text-primary">Event operations</p><h1 className="font-display text-4xl font-semibold tracking-tight">{isEdit ? "Edit and resubmit" : "Propose an event"}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Add the details, schedule, member and non-member pricing, and the budget you need. A mentor authorizes the proposal before tickets go on sale.</p></div>
      {latestFeedback && event?.status === "CHANGES_REQUESTED" && <div className="mt-6 rounded-xl border border-warning/30 bg-warning-soft p-4 text-sm text-warning" role="status"><p className="font-semibold">Mentor feedback from {latestFeedback.reviewer?.name}</p><p className="mt-1">{latestFeedback.comment}</p></div>}

      <div className="mt-8" aria-label={"Step " + currentStep + " of " + STEPS.length + ": " + STEPS[currentStep - 1]}>
        <div className="flex gap-2">{STEPS.map((step, index) => <div key={step} className={"h-1.5 flex-1 rounded-full " + (index < currentStep ? "bg-primary" : "bg-secondary")} />)}</div>
        <p className="mt-3 text-sm font-medium">Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1]}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-8" noValidate>
        {currentStep === 1 && <div className="space-y-5">
          <div><label htmlFor="event-title" className="mb-2 block text-sm font-medium">Event title</label><Input id="event-title" aria-invalid={!!errors.title} {...register("title", { required: "Event title is required" })} />{errors.title && <p className="mt-2 text-sm text-destructive">{errors.title.message}</p>}</div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div><label htmlFor="event-category" className="mb-2 block text-sm font-medium">Category</label><select id="event-category" {...register("category")} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50">{CATEGORIES.map((c) => <option key={c} value={c}>{categoryLabel(c)}</option>)}</select></div>
            <div><label htmlFor="event-visibility" className="mb-2 block text-sm font-medium">Visibility</label><select id="event-visibility" {...register("visibility")} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"><option value="PUBLIC">Public</option><option value="MEMBERS_ONLY">Members only</option></select></div>
          </div>
          <div><label htmlFor="event-description" className="mb-2 block text-sm font-medium">Description</label><textarea id="event-description" rows={6} aria-invalid={!!errors.description} {...register("description", { required: "Description is required" })} className="w-full resize-y rounded-xl border border-input bg-background px-4 py-3 text-sm leading-6 outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50" />{errors.description && <p className="mt-2 text-sm text-destructive">{errors.description.message}</p>}</div>
        </div>}

        {currentStep === 2 && <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2"><div><label htmlFor="event-start" className="mb-2 block text-sm font-medium">Starts</label><Input id="event-start" type="datetime-local" aria-invalid={!!errors.startAt} {...register("startAt", { required: "Start time is required" })} />{errors.startAt && <p className="mt-2 text-sm text-destructive">{errors.startAt.message}</p>}</div><div><label htmlFor="event-end" className="mb-2 block text-sm font-medium">Ends</label><Input id="event-end" type="datetime-local" aria-invalid={!!errors.endAt} {...register("endAt", { required: "End time is required" })} />{errors.endAt && <p className="mt-2 text-sm text-destructive">{errors.endAt.message}</p>}</div></div>
          <div><label htmlFor="event-venue" className="mb-2 block text-sm font-medium">Venue</label><Input id="event-venue" aria-invalid={!!errors.venue} {...register("venue", { required: "Venue is required" })} />{errors.venue && <p className="mt-2 text-sm text-destructive">{errors.venue.message}</p>}</div>
          <div><label htmlFor="event-capacity" className="mb-2 block text-sm font-medium">Total capacity</label><Input id="event-capacity" type="number" min="1" aria-invalid={!!errors.capacity} {...register("capacity", { required: "Capacity is required", valueAsNumber: true, min: { value: 1, message: "Capacity must be at least 1" } })} />{errors.capacity && <p className="mt-2 text-sm text-destructive">{errors.capacity.message}</p>}</div>
        </div>}

        {currentStep === 3 && <div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="font-display text-xl font-semibold">Ticket types</h2><p className="mt-1 text-sm text-muted-foreground">Quotas total {allocatedQuota} of {Number(values.capacity || 0)} places. Members are offered the member ticket automatically.</p></div><Button type="button" variant="outline" onClick={() => append({ name: "", audience: "ALL", price: 0, quota: 1, maxPerUser: 1 })}><Plus aria-hidden="true" /> Add ticket</Button></div>
          <div className="mt-6 space-y-4">{fields.map((field, index) => <div key={field.id} className="rounded-xl border border-border bg-secondary/20 p-4"><div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Ticket {index + 1}</h3><Button type="button" variant="ghost" size="icon-sm" aria-label={"Remove ticket " + (index + 1)} onClick={() => remove(index)} disabled={fields.length === 1}><Trash2 aria-hidden="true" /></Button></div><div className="mt-4 grid gap-4 sm:grid-cols-2"><div><label className="mb-2 block text-xs font-medium">Name</label><Input {...register("ticketTypes." + index + ".name", { required: "Ticket name is required" })} /></div><div><label className="mb-2 block text-xs font-medium">Audience</label><select {...register("ticketTypes." + index + ".audience")} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="ALL">Everyone</option><option value="MEMBER">Members</option><option value="NON_MEMBER">Non-members</option></select></div><div><label className="mb-2 block text-xs font-medium">Price (₹)</label><Input type="number" min="0" step="0.01" {...register("ticketTypes." + index + ".price", { valueAsNumber: true, min: 0 })} /></div><div><label className="mb-2 block text-xs font-medium">Quota</label><Input type="number" min="1" {...register("ticketTypes." + index + ".quota", { valueAsNumber: true, min: 1 })} /></div><div><label className="mb-2 block text-xs font-medium">Maximum per person</label><Input type="number" min="1" {...register("ticketTypes." + index + ".maxPerUser", { valueAsNumber: true, min: 1 })} /></div></div></div>)}</div>
          {allocatedQuota > Number(values.capacity || 0) && <p className="mt-4 text-sm text-destructive" role="alert">Ticket quotas exceed the event capacity.</p>}
        </div>}

        {currentStep === 4 && <div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="font-display text-xl font-semibold">Budget request</h2><p className="mt-1 text-sm text-muted-foreground">Requested total {formatINR(requestedBudget)}. The mentor approves the final amount, and expense claims for this event are capped at it.</p></div><Button type="button" variant="outline" onClick={() => budget.append({ category: "", amount: 0, note: "" })}><Plus aria-hidden="true" /> Add line</Button></div>
          {budget.fields.length === 0 && <p className="mt-6 rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">No budget requested. Add lines for venue, food, prizes, or other costs.</p>}
          <div className="mt-6 space-y-3">{budget.fields.map((field, index) => <div key={field.id} className="grid gap-3 rounded-xl border border-border bg-secondary/20 p-4 sm:grid-cols-[1fr_140px_1fr_auto] sm:items-end"><div><label htmlFor={"budget-category-" + index} className="mb-2 block text-xs font-medium">Item</label><Input id={"budget-category-" + index} placeholder="e.g. Venue" {...register("budgetLines." + index + ".category", { required: true })} /></div><div><label htmlFor={"budget-amount-" + index} className="mb-2 block text-xs font-medium">Amount (₹)</label><Input id={"budget-amount-" + index} type="number" min="1" step="1" {...register("budgetLines." + index + ".amount", { valueAsNumber: true, min: 1 })} /></div><div><label htmlFor={"budget-note-" + index} className="mb-2 block text-xs font-medium">Note</label><Input id={"budget-note-" + index} {...register("budgetLines." + index + ".note")} /></div><Button type="button" variant="ghost" size="icon-sm" aria-label={"Remove budget line " + (index + 1)} onClick={() => budget.remove(index)}><Trash2 aria-hidden="true" /></Button></div>)}</div>
        </div>}

        {currentStep === 5 && <div><h2 className="font-display text-2xl font-semibold">Review proposal</h2><div className="mt-6 grid gap-4 rounded-xl bg-secondary/40 p-5 text-sm sm:grid-cols-2"><div><p className="text-xs text-muted-foreground">Title</p><p className="mt-1 font-medium">{values.title}</p></div><div><p className="text-xs text-muted-foreground">Category</p><p className="mt-1 font-medium">{categoryLabel(values.category)}</p></div><div><p className="text-xs text-muted-foreground">Venue</p><p className="mt-1 font-medium">{values.venue}</p></div><div><p className="text-xs text-muted-foreground">Capacity</p><p className="mt-1 font-medium">{values.capacity}</p></div><div><p className="text-xs text-muted-foreground">Schedule</p><p className="mt-1 font-medium">{values.startAt ? new Date(values.startAt).toLocaleString() : "Not set"}</p></div><div><p className="text-xs text-muted-foreground">Tickets</p><p className="mt-1 font-medium">{fields.length} type{fields.length === 1 ? "" : "s"} · {allocatedQuota} places</p></div><div><p className="text-xs text-muted-foreground">Budget requested</p><p className="mt-1 font-medium">{formatINR(requestedBudget)}</p></div></div><p className="mt-5 text-sm leading-6 text-muted-foreground">The proposal goes to a mentor. Once approved, the event is published and the ticket types open for sale.</p></div>}

        <div className="mt-8 flex items-center justify-between border-t border-border pt-6"><Button type="button" variant="outline" onClick={() => setCurrentStep((step) => Math.max(1, step - 1))} disabled={currentStep === 1}>Previous</Button><Button type="submit" disabled={submitEvent.isPending || (currentStep === 3 && allocatedQuota > Number(values.capacity || 0))}>{submitEvent.isPending ? "Submitting…" : currentStep === STEPS.length ? (isEdit ? "Resubmit for review" : "Submit for review") : "Continue"}</Button></div>
      </form>
    </div>
  );
}
