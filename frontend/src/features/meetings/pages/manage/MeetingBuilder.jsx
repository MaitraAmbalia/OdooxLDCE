import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Clock3, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function MeetingBuilder() {
  usePageTitle("Schedule meeting");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({ title: "", scheduledAt: "", location: "", audienceType: "LEADERS" });
  const [agenda, setAgenda] = useState([]);
  const [newItem, setNewItem] = useState({ topic: "", owner: "", minutes: 15 });

  const totalMinutes = agenda.reduce((total, item) => total + Number(item.minutes || 0), 0);

  const addAgendaItem = () => {
    if (!newItem.topic.trim()) return;
    setAgenda((current) => [...current, { ...newItem, topic: newItem.topic.trim(), id: crypto.randomUUID() }]);
    setNewItem({ topic: "", owner: "", minutes: 15 });
  };

  const createMeetingMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await fetch("/api/v1/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: payload.title,
          date: payload.scheduledAt,
          venue: payload.location,
          audience: payload.audienceType,
          agenda: payload.agenda.map((item) => item.topic + " (" + item.minutes + "m" + (item.owner ? " · " + item.owner : "") + ")").join("\n"),
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error?.message || "Could not schedule meeting");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      toast.success("Meeting scheduled.");
      navigate("/manage/meetings");
    },
    onError: (error) => toast.error(error.message || "Could not schedule meeting."),
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    createMeetingMutation.mutate({ ...formData, agenda });
  };

  return (
    <div className="page-container max-w-4xl py-12 sm:py-16">
      <Button asChild variant="ghost" className="mb-6 -ml-3">
        <Link to="/manage/meetings"><ArrowLeft aria-hidden="true" /> Back to meetings</Link>
      </Button>
      <p className="mb-2 text-sm font-medium text-primary">Association operations</p>
      <h1 className="font-display text-4xl font-semibold tracking-tight">Schedule a meeting</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Set the essentials first, then add a focused agenda for everyone invited.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-7" aria-labelledby="meeting-details-heading">
          <h2 id="meeting-details-heading" className="font-display text-xl font-semibold">Meeting details</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label htmlFor="meeting-title" className="mb-2 block text-sm font-medium">Title</label>
              <Input id="meeting-title" required value={formData.title} onChange={(event) => setFormData({ ...formData, title: event.target.value })} placeholder="Gala logistics sync" />
            </div>
            <div>
              <label htmlFor="meeting-date" className="mb-2 block text-sm font-medium">Date and time</label>
              <Input id="meeting-date" type="datetime-local" required value={formData.scheduledAt} onChange={(event) => setFormData({ ...formData, scheduledAt: event.target.value })} />
            </div>
            <div>
              <label htmlFor="meeting-location" className="mb-2 block text-sm font-medium">Location or link</label>
              <Input id="meeting-location" required value={formData.location} onChange={(event) => setFormData({ ...formData, location: event.target.value })} placeholder="Room 4B or video link" />
            </div>
            <div>
              <label htmlFor="meeting-audience" className="mb-2 block text-sm font-medium">Audience</label>
              <select id="meeting-audience" value={formData.audienceType} onChange={(event) => setFormData({ ...formData, audienceType: event.target.value })} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                <option value="LEADERS">All leaders</option>
                <option value="VOLUNTEERS">All volunteers</option>
                <option value="BOTH">Leaders and volunteers</option>
              </select>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 sm:p-7" aria-labelledby="agenda-heading">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 id="agenda-heading" className="font-display text-xl font-semibold">Agenda</h2>
              <p className="mt-1 text-sm text-muted-foreground">Optional talking points help invitees prepare.</p>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-sm font-medium"><Clock3 className="size-4" aria-hidden="true" />{Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m</span>
          </div>

          <ol className="mt-6 space-y-3">
            {agenda.map((item, index) => (
              <li key={item.id} className="flex items-start gap-3 rounded-xl border border-border bg-secondary/25 p-4">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{item.topic}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.owner || "Shared discussion"} · {item.minutes} minutes</p>
                </div>
                <Button type="button" variant="ghost" size="icon-sm" aria-label={"Remove " + item.topic} onClick={() => setAgenda((current) => current.filter((entry) => entry.id !== item.id))}><Trash2 aria-hidden="true" /></Button>
              </li>
            ))}
          </ol>

          {agenda.length === 0 && <div className="mt-6 rounded-xl border border-dashed border-border px-5 py-8 text-center text-sm text-muted-foreground">No agenda items yet.</div>}

          <div className="mt-6 grid gap-3 border-t border-border pt-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.65fr)_7rem_auto] sm:items-end">
            <div><label htmlFor="agenda-topic" className="mb-2 block text-xs font-medium">Topic</label><Input id="agenda-topic" value={newItem.topic} onChange={(event) => setNewItem({ ...newItem, topic: event.target.value })} placeholder="Discussion topic" /></div>
            <div><label htmlFor="agenda-owner" className="mb-2 block text-xs font-medium">Owner</label><Input id="agenda-owner" value={newItem.owner} onChange={(event) => setNewItem({ ...newItem, owner: event.target.value })} placeholder="Optional" /></div>
            <div><label htmlFor="agenda-minutes" className="mb-2 block text-xs font-medium">Minutes</label><Input id="agenda-minutes" type="number" min="1" value={newItem.minutes} onChange={(event) => setNewItem({ ...newItem, minutes: event.target.value })} /></div>
            <Button type="button" variant="outline" onClick={addAgendaItem} disabled={!newItem.topic.trim()}><Plus aria-hidden="true" /> Add</Button>
          </div>
        </section>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button asChild variant="outline"><Link to="/manage/meetings">Cancel</Link></Button>
          <Button type="submit" size="lg" disabled={createMeetingMutation.isPending}>{createMeetingMutation.isPending ? "Scheduling…" : "Schedule meeting"}</Button>
        </div>
      </form>
    </div>
  );
}
