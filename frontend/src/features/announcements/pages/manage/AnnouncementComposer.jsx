import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, Eye, Pencil, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function AnnouncementComposer() {
  usePageTitle("New announcement");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({ title: "", body: "", audience: "PUBLIC" });
  const [showPreview, setShowPreview] = useState(false);

  const composeMutation = useMutation({
    mutationFn: async (data) => {
      const response = await fetch("/api/v1/announcements", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error?.message || "Could not publish announcement");
      return json.data;
    },
    onSuccess: (announcement) => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("Announcement published.");
      navigate(announcement?.id ? "/announcements/" + announcement.id : "/announcements");
    },
    onError: (error) => toast.error(error.message || "Could not publish announcement."),
  });

  const canPublish = formData.title.trim() && formData.body.trim();

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!canPublish) return;
    composeMutation.mutate({
      title: formData.title.trim(),
      body: formData.body.trim(),
      audience: formData.audience,
    });
  };

  return (
    <div className="page-container max-w-5xl py-12 sm:py-16">
      <Button asChild variant="ghost" className="mb-6 -ml-3">
        <Link to="/manage"><ArrowLeft aria-hidden="true" /> Back to manage</Link>
      </Button>

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium text-primary">Communications</p>
            <h1 className="font-display text-4xl font-semibold tracking-tight">New announcement</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Publish a clear update to the public feed or active members.</p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setShowPreview((current) => !current)}>
              {showPreview ? <Pencil aria-hidden="true" /> : <Eye aria-hidden="true" />}
              {showPreview ? "Continue editing" : "Preview"}
            </Button>
            <Button type="submit" disabled={!canPublish || composeMutation.isPending}>
              <Send aria-hidden="true" />{composeMutation.isPending ? "Publishing…" : "Publish"}
            </Button>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <section className="min-h-[32rem] rounded-2xl border border-border bg-card p-5 sm:p-7" aria-label={showPreview ? "Announcement preview" : "Announcement editor"}>
            {showPreview ? (
              <div>
                <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium">{formData.audience === "MEMBERS" ? "Members" : "Public"}</span>
                <h2 className="mt-5 font-display text-3xl font-semibold tracking-tight">{formData.title || "Untitled announcement"}</h2>
                <article className="prose prose-sm mt-8 max-w-none text-foreground sm:prose-base">
                  <ReactMarkdown>{formData.body || "_Your announcement preview will appear here._"}</ReactMarkdown>
                </article>
              </div>
            ) : (
              <div className="flex min-h-[28rem] flex-col">
                <label htmlFor="announcement-title" className="text-sm font-medium">Title</label>
                <Input id="announcement-title" value={formData.title} onChange={(event) => setFormData({ ...formData, title: event.target.value })} placeholder="What does the community need to know?" className="mt-2 h-12 text-lg font-semibold sm:text-lg" maxLength={160} required />
                <div className="mt-6 flex items-center justify-between">
                  <label htmlFor="announcement-body" className="text-sm font-medium">Message</label>
                  <span className="text-xs text-muted-foreground">Markdown supported</span>
                </div>
                <textarea id="announcement-body" value={formData.body} onChange={(event) => setFormData({ ...formData, body: event.target.value })} placeholder="Write the announcement…" className="mt-2 min-h-80 flex-1 resize-y rounded-xl border border-input bg-background px-4 py-3 text-sm leading-7 outline-none transition-shadow placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" required />
              </div>
            )}
          </section>

          <aside className="h-fit rounded-2xl border border-border bg-card p-5" aria-labelledby="audience-heading">
            <h2 id="audience-heading" className="font-display text-lg font-semibold">Audience</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">Choose who can see this update.</p>
            <fieldset className="mt-5 space-y-3">
              <legend className="sr-only">Announcement audience</legend>
              {[
                { id: "PUBLIC", label: "Everyone", description: "Visible on the public updates feed." },
                { id: "MEMBERS", label: "Active members", description: "Intended for the member community." },
              ].map((audience) => (
                <label key={audience.id} className={"block cursor-pointer rounded-xl border p-4 transition-colors " + (formData.audience === audience.id ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/30")}>
                  <span className="flex items-start gap-3">
                    <input type="radio" name="audience" value={audience.id} checked={formData.audience === audience.id} onChange={(event) => setFormData({ ...formData, audience: event.target.value })} className="mt-1 accent-primary" />
                    <span><span className="block text-sm font-medium">{audience.label}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{audience.description}</span></span>
                  </span>
                </label>
              ))}
            </fieldset>
            <div className="mt-5 rounded-xl bg-secondary/50 p-4 text-xs leading-5 text-muted-foreground">
              Publishing posts this announcement to the updates feed immediately. Email delivery is not currently connected.
            </div>
          </aside>
        </div>
      </form>
    </div>
  );
}
