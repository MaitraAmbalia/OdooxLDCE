import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useFieldArray, useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePageTitle } from "@/hooks/usePageTitle";

const STEPS = ["Basics", "Schedule", "Tickets", "Sponsorship", "Review"];

export default function EventProposalStepper() {
  usePageTitle("Create event");
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const suggestedDate = searchParams.get("date");
  const queryClient = useQueryClient();
  const { register, handleSubmit, watch, control, formState: { errors } } = useForm({
    defaultValues: {
      category: "Social",
      visibility: "PUBLIC",
      capacity: 100,
      startAt: suggestedDate ? `${suggestedDate.slice(0, 10)}T10:00` : "",
      endAt: suggestedDate ? `${suggestedDate.slice(0, 10)}T11:00` : "",
      sponsorshipRequired: false,
      sponsorshipTarget: 0,
      sponsorshipDeadline: "",
      sponsorshipPitch: "",
      sponsorshipPackagesText: "Title Sponsor, Gold Sponsor, Silver Sponsor",
      sponsorBenefits: "",
      ticketTypes: [{ name: "General admission", audience: "ALL", price: 0, quota: 100, maxPerUser: 5 }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "ticketTypes" });
  const values = watch();
  const allocatedQuota = (values.ticketTypes || []).reduce((total, ticket) => total + Number(ticket.quota || 0), 0);

  const submitEvent = useMutation({
    mutationFn: async (data) => {
      const payload = {
        title: data.title.trim(),
        description: data.description.trim(),
        category: data.category,
        venue: data.venue.trim(),
        startAt: data.startAt,
        endAt: data.endAt,
        capacity: Number(data.capacity),
        visibility: data.visibility,
        sponsorshipRequired: Boolean(data.sponsorshipRequired),
        sponsorshipTargetPaise: data.sponsorshipRequired ? Math.round(Number(data.sponsorshipTarget || 0) * 100) : null,
        sponsorshipDeadline: data.sponsorshipRequired ? data.sponsorshipDeadline : null,
        sponsorshipPitch: data.sponsorshipRequired ? data.sponsorshipPitch.trim() : null,
        sponsorshipPackages: data.sponsorshipRequired
          ? data.sponsorshipPackagesText.split(",").map((value) => value.trim()).filter(Boolean)
          : null,
        sponsorBenefits: data.sponsorshipRequired ? data.sponsorBenefits.trim() : null,
        ticketTypes: (data.ticketTypes || []).map((ticket) => ({
          name: ticket.name.trim(),
          audience: ticket.audience,
          pricePaise: Math.round(Number(ticket.price || 0) * 100),
          quota: Number(ticket.quota),
          maxPerUser: Number(ticket.maxPerUser || 1),
        })),
      };
      const response = await fetch("/api/v1/events", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error?.message || "Could not create event");
      return json.data;
    },
    onSuccess: (event) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event created.");
      navigate(event?.id ? "/events/" + event.id : "/events");
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
      toast.error("Ticket quotas cannot exceed event capacity.");
      setCurrentStep(3);
      return;
    }
    if (data.sponsorshipRequired && new Date(data.sponsorshipDeadline) >= new Date(data.startAt)) {
      toast.error("The sponsorship deadline must be before the event starts.");
      setCurrentStep(4);
      return;
    }
    submitEvent.mutate(data);
  };

  return (
    <div className="page-container max-w-4xl py-12 sm:py-16">
      <Button asChild variant="ghost" className="mb-6 -ml-3"><Link to="/manage"><ArrowLeft aria-hidden="true" /> Back to manage</Link></Button>
      <div><p className="mb-2 text-sm font-medium text-primary">Event operations</p><h1 className="font-display text-4xl font-semibold tracking-tight">Create an event</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Add the public details, schedule, and ticket allocation before publishing.</p></div>

      <div className="mt-8" aria-label={"Step " + currentStep + " of " + STEPS.length + ": " + STEPS[currentStep - 1]}>
        <div className="flex gap-2">{STEPS.map((step, index) => <div key={step} className={"h-1.5 flex-1 rounded-full " + (index < currentStep ? "bg-primary" : "bg-secondary")} />)}</div>
        <p className="mt-3 text-sm font-medium">Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1]}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-8" noValidate>
        {currentStep === 1 && <div className="space-y-5">
          <div><label htmlFor="event-title" className="mb-2 block text-sm font-medium">Event title</label><Input id="event-title" aria-invalid={!!errors.title} {...register("title", { required: "Event title is required" })} />{errors.title && <p className="mt-2 text-sm text-destructive">{errors.title.message}</p>}</div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div><label htmlFor="event-category" className="mb-2 block text-sm font-medium">Category</label><select id="event-category" {...register("category")} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"><option>Social</option><option>Academic</option><option>Workshop</option><option>Sports</option><option>Cultural</option></select></div>
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="font-display text-xl font-semibold">Ticket types</h2><p className="mt-1 text-sm text-muted-foreground">Quotas total {allocatedQuota} of {Number(values.capacity || 0)} places.</p></div><Button type="button" variant="outline" onClick={() => append({ name: "", audience: "ALL", price: 0, quota: 1, maxPerUser: 1 })}><Plus aria-hidden="true" /> Add ticket</Button></div>
          <div className="mt-6 space-y-4">{fields.map((field, index) => <div key={field.id} className="rounded-xl border border-border bg-secondary/20 p-4"><div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Ticket {index + 1}</h3><Button type="button" variant="ghost" size="icon-sm" aria-label={"Remove ticket " + (index + 1)} onClick={() => remove(index)} disabled={fields.length === 1}><Trash2 aria-hidden="true" /></Button></div><div className="mt-4 grid gap-4 sm:grid-cols-2"><div><label className="mb-2 block text-xs font-medium">Name</label><Input {...register("ticketTypes." + index + ".name", { required: "Ticket name is required" })} /></div><div><label className="mb-2 block text-xs font-medium">Audience</label><select {...register("ticketTypes." + index + ".audience")} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="ALL">Everyone</option><option value="MEMBER">Members</option><option value="NON_MEMBER">Non-members</option></select></div><div><label className="mb-2 block text-xs font-medium">Price (₹)</label><Input type="number" min="0" step="0.01" {...register("ticketTypes." + index + ".price", { valueAsNumber: true, min: 0 })} /></div><div><label className="mb-2 block text-xs font-medium">Quota</label><Input type="number" min="1" {...register("ticketTypes." + index + ".quota", { valueAsNumber: true, min: 1 })} /></div><div><label className="mb-2 block text-xs font-medium">Maximum per person</label><Input type="number" min="1" {...register("ticketTypes." + index + ".maxPerUser", { valueAsNumber: true, min: 1 })} /></div></div></div>)}</div>
          {allocatedQuota > Number(values.capacity || 0) && <p className="mt-4 text-sm text-destructive" role="alert">Ticket quotas exceed the event capacity.</p>}
        </div>}

        {currentStep === 4 && <div className="space-y-5">
          <div><h2 className="font-display text-2xl font-semibold">Sponsorship brief</h2><p className="mt-2 text-sm text-muted-foreground">Define what the Sponsorship Head needs before outreach begins. Sponsor contacts and communication will stay in Odoo CRM.</p></div>
          <label className="flex items-start gap-3 rounded-xl border border-border bg-secondary/20 p-4"><input type="checkbox" className="mt-1 size-4" {...register("sponsorshipRequired")} /><span><span className="block text-sm font-semibold">This event requires sponsorship</span><span className="mt-1 block text-xs text-muted-foreground">The brief becomes available to the Sponsorship Head only after event approval.</span></span></label>
          {values.sponsorshipRequired && <div className="space-y-5 rounded-xl border border-border p-5">
            <div className="grid gap-5 sm:grid-cols-2"><div><label htmlFor="sponsorship-target" className="mb-2 block text-sm font-medium">Target amount (₹)</label><Input id="sponsorship-target" type="number" min="1" step="0.01" aria-invalid={!!errors.sponsorshipTarget} {...register("sponsorshipTarget", { valueAsNumber: true, validate: (value) => !watch("sponsorshipRequired") || Number(value) >= 1 || "Target must be positive" })} />{errors.sponsorshipTarget && <p className="mt-2 text-sm text-destructive">{errors.sponsorshipTarget.message}</p>}</div><div><label htmlFor="sponsorship-deadline" className="mb-2 block text-sm font-medium">Outreach deadline</label><Input id="sponsorship-deadline" type="datetime-local" aria-invalid={!!errors.sponsorshipDeadline} {...register("sponsorshipDeadline", { validate: (value) => !watch("sponsorshipRequired") || Boolean(value) || "Deadline is required" })} />{errors.sponsorshipDeadline && <p className="mt-2 text-sm text-destructive">{errors.sponsorshipDeadline.message}</p>}</div></div>
            <div><label htmlFor="sponsorship-packages" className="mb-2 block text-sm font-medium">Packages, separated by commas</label><Input id="sponsorship-packages" aria-invalid={!!errors.sponsorshipPackagesText} {...register("sponsorshipPackagesText", { validate: (value) => !watch("sponsorshipRequired") || value.split(",").some((item) => item.trim()) || "At least one package is required" })} />{errors.sponsorshipPackagesText && <p className="mt-2 text-sm text-destructive">{errors.sponsorshipPackagesText.message}</p>}</div>
            <div><label htmlFor="sponsorship-pitch" className="mb-2 block text-sm font-medium">Sponsor pitch</label><textarea id="sponsorship-pitch" rows={4} aria-invalid={!!errors.sponsorshipPitch} {...register("sponsorshipPitch", { validate: (value) => !watch("sponsorshipRequired") || Boolean(value?.trim()) || "Sponsor pitch is required" })} className="w-full resize-y rounded-xl border border-input bg-background px-4 py-3 text-sm leading-6 outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50" />{errors.sponsorshipPitch && <p className="mt-2 text-sm text-destructive">{errors.sponsorshipPitch.message}</p>}</div>
            <div><label htmlFor="sponsor-benefits" className="mb-2 block text-sm font-medium">Benefits offered</label><textarea id="sponsor-benefits" rows={4} aria-invalid={!!errors.sponsorBenefits} {...register("sponsorBenefits", { validate: (value) => !watch("sponsorshipRequired") || Boolean(value?.trim()) || "Sponsor benefits are required" })} className="w-full resize-y rounded-xl border border-input bg-background px-4 py-3 text-sm leading-6 outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50" />{errors.sponsorBenefits && <p className="mt-2 text-sm text-destructive">{errors.sponsorBenefits.message}</p>}</div>
          </div>}
        </div>}

        {currentStep === 5 && <div><h2 className="font-display text-2xl font-semibold">Review event</h2><div className="mt-6 grid gap-4 rounded-xl bg-secondary/40 p-5 text-sm sm:grid-cols-2"><div><p className="text-xs text-muted-foreground">Title</p><p className="mt-1 font-medium">{values.title}</p></div><div><p className="text-xs text-muted-foreground">Category</p><p className="mt-1 font-medium">{values.category}</p></div><div><p className="text-xs text-muted-foreground">Venue</p><p className="mt-1 font-medium">{values.venue}</p></div><div><p className="text-xs text-muted-foreground">Capacity</p><p className="mt-1 font-medium">{values.capacity}</p></div><div><p className="text-xs text-muted-foreground">Schedule</p><p className="mt-1 font-medium">{values.startAt ? new Date(values.startAt).toLocaleString() : "Not set"}</p></div><div><p className="text-xs text-muted-foreground">Tickets</p><p className="mt-1 font-medium">{fields.length} type{fields.length === 1 ? "" : "s"} · {allocatedQuota} places</p></div><div><p className="text-xs text-muted-foreground">Sponsorship</p><p className="mt-1 font-medium">{values.sponsorshipRequired ? `Required · ₹${Number(values.sponsorshipTarget || 0).toLocaleString("en-IN")}` : "Not required"}</p></div></div><p className="mt-5 text-sm leading-6 text-muted-foreground">Publishing makes this event visible according to its selected visibility and opens the configured ticket types.</p></div>}

        <div className="mt-8 flex items-center justify-between border-t border-border pt-6"><Button type="button" variant="outline" onClick={() => setCurrentStep((step) => Math.max(1, step - 1))} disabled={currentStep === 1}>Previous</Button><Button type="submit" disabled={submitEvent.isPending || (currentStep === 3 && allocatedQuota > Number(values.capacity || 0))}>{submitEvent.isPending ? "Publishing…" : currentStep === STEPS.length ? "Publish event" : "Continue"}</Button></div>
      </form>
    </div>
  );
}
