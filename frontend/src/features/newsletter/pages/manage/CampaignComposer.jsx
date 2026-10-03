import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Send, Sparkles, Eye, Code, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function CampaignComposer() {
  usePageTitle("Compose Campaign");
  const navigate = useNavigate();

  const [subject, setSubject] = useState("");
  const [bodyMd, setBodyMd] = useState(
    "## Hello Skyline Community!\n\nWe are excited to share upcoming updates and opportunities across campus.\n\n### What's coming up:\n- **Flagship Events**: Check out our Spring Gala and CodeWave Hackathon.\n- **Member Perks**: Exclusive discounts and priority registration.\n\nStay connected and don't hesitate to reach out with any questions!"
  );
  const [previewMode, setPreviewMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSaveDraft = async () => {
    if (!subject.trim()) {
      toast.error("Please enter an email subject line");
      return;
    }
    if (!bodyMd.trim()) {
      toast.error("Please write campaign content");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/newsletter/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ subject, bodyMd }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to save draft");

      toast.success("Campaign draft saved!");
      navigate("/manage/newsletter");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendNow = async () => {
    if (!subject.trim()) {
      toast.error("Please enter an email subject line");
      return;
    }
    if (!bodyMd.trim()) {
      toast.error("Please write campaign content");
      return;
    }

    if (!window.confirm("Send this campaign to all active subscribers via Nodemailer outbox?")) {
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create campaign
      const createRes = await fetch("/api/v1/newsletter/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ subject, bodyMd }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.error?.message || "Failed to create campaign");

      const campaignId = createData.data.id;

      // 2. Dispatch/send campaign
      const sendRes = await fetch(`/api/v1/newsletter/campaigns/${campaignId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const sendData = await sendRes.json();
      if (!sendRes.ok) throw new Error(sendData.error?.message || "Failed to dispatch campaign");

      toast.success(`Campaign queued! Dispatched to ${sendData.data.recipientsCount} subscribers.`);
      navigate("/manage/newsletter");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container py-12 sm:py-16">
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/manage/newsletter"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="size-4" /> Back to Communications
        </Link>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewMode(!previewMode)}
            className="gap-1.5"
          >
            {previewMode ? <Code className="size-3.5" /> : <Eye className="size-3.5" />}
            {previewMode ? "Edit Markdown" : "Preview Email"}
          </Button>
        </div>
      </div>

      <div className="max-w-4xl">
        <div className="mb-8">
          <p className="text-sm font-medium text-primary">Promotional broadcast</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Compose Email Campaign
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Write an announcement or newsletter to be delivered to all confirmed subscribers.
          </p>
        </div>

        <div className="space-y-6 rounded-2xl border border-border bg-card p-6 sm:p-8">
          <div>
            <label htmlFor="subject" className="block text-sm font-semibold text-foreground">
              Subject Line
            </label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. October Skyline Newsletter: Events, Merch & Hackathons"
              className="mt-2 h-11"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="content" className="block text-sm font-semibold text-foreground">
                Email Content {previewMode ? "(Email HTML Preview)" : "(Markdown Supported)"}
              </label>
              <span className="text-xs text-muted-foreground">Supports # headings, **bold**, and [links](url)</span>
            </div>

            {previewMode ? (
              <div className="mt-2 rounded-xl border border-border bg-[#f8fafc] p-6 text-foreground">
                <div className="mx-auto max-w-lg rounded-xl border border-border bg-white p-6 shadow-sm">
                  <div className="border-b border-border pb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                      Skyline Student Club
                    </span>
                    <h2 className="mt-1 text-lg font-bold text-foreground">{subject || "Untitled Email"}</h2>
                  </div>
                  <div className="py-4 text-sm leading-relaxed whitespace-pre-line">
                    {bodyMd}
                  </div>
                  <div className="border-t border-border pt-4 text-center text-xs text-muted-foreground">
                    <p>© {new Date().getFullYear()} Skyline Student Association</p>
                    <p className="mt-1 text-primary">Unsubscribe link included automatically</p>
                  </div>
                </div>
              </div>
            ) : (
              <Textarea
                id="content"
                rows={12}
                value={bodyMd}
                onChange={(e) => setBodyMd(e.target.value)}
                placeholder="Write your email body here..."
                className="mt-2 font-mono text-sm leading-relaxed"
              />
            )}
          </div>

          <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isSubmitting}
            >
              Save as Draft
            </Button>
            <Button
              variant="default"
              onClick={handleSendNow}
              disabled={isSubmitting}
              className="gap-2"
            >
              <Send className="size-4" />
              {isSubmitting ? "Queueing..." : "Send Campaign Now"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
