import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  MailCheck,
  Plus,
  Send,
  Users,
  CheckCircle,
  Clock,
  Sparkles,
  Megaphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ContentState } from "@/components/common/ContentState";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";
import { toast } from "sonner";

export default function NewsletterDashboard() {
  usePageTitle("Communications & Newsletter");
  const [activeTab, setActiveTab] = useState("campaigns"); // "campaigns" | "subscribers" | "announcements"
  const [sendingId, setSendingId] = useState(null);

  // 1. Fetch Subscriber & Campaign Stats
  const { data: statsData, isPending: statsLoading } = useQuery({
    queryKey: ["newsletter", "stats"],
    queryFn: async () => {
      const res = await fetch("/api/v1/newsletter/subscribers/stats", { credentials: "include" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to load stats");
      return json.data;
    },
  });

  // 2. Fetch Campaigns
  const {
    data: campaignsData,
    isPending: campaignsLoading,
    refetch: refetchCampaigns,
  } = useQuery({
    queryKey: ["newsletter", "campaigns"],
    queryFn: async () => {
      const res = await fetch("/api/v1/newsletter/campaigns", { credentials: "include" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to load campaigns");
      return json.data;
    },
  });

  // 3. Fetch Subscribers
  const { data: subscribersData, isPending: subscribersLoading } = useQuery({
    queryKey: ["newsletter", "subscribers"],
    queryFn: async () => {
      const res = await fetch("/api/v1/newsletter/subscribers?limit=50", { credentials: "include" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to load subscribers");
      return json.data;
    },
  });

  // 4. Fetch Announcements Feed
  const { data: announcementsData, isPending: announcementsLoading, refetch: refetchAnnouncements } = useQuery({
    queryKey: ["announcements", { limit: 50 }],
    queryFn: async () => {
      const response = await fetch("/api/v1/announcements?limit=50", { credentials: "include" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error?.message || "Failed to fetch announcements");
      return json;
    },
  });

  const stats = statsData || {
    subscribers: { total: 0, subscribed: 0, pending: 0, unsubscribed: 0 },
    campaigns: { total: 0, sent: 0 },
  };
  const campaigns = campaignsData || [];
  const subscribers = subscribersData || [];
  const announcements = announcementsData?.data || [];

  const handleSendCampaign = async (id) => {
    if (!window.confirm("Send this campaign now to all active subscribers?")) return;
    setSendingId(id);
    try {
      const res = await fetch(`/api/v1/newsletter/campaigns/${id}/send`, {
        method: "POST",
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to send");
      toast.success(`Dispatched to ${json.data.recipientsCount} subscribers!`);
      refetchCampaigns();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="page-container py-12 sm:py-16">
      {/* Header */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-medium text-primary">Community outreach</p>
          <h1 className="font-display text-4xl font-semibold tracking-tight">Communications & Mail</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Manage email campaigns, newsletters, verified subscribers, and official campus announcements.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link to="/manage/announcements/new">
              <Megaphone className="mr-1.5 size-4" /> New Announcement
            </Link>
          </Button>
          <Button asChild size="default">
            <Link to="/manage/newsletter/campaigns/new">
              <Plus className="mr-1.5 size-4" /> Compose Campaign
            </Link>
          </Button>
        </div>
      </div>

      {/* Connected Status Banner */}
      <div className="mt-8 flex items-start gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 text-emerald-950">
        <div className="rounded-full bg-emerald-100 p-2 text-emerald-700">
          <MailCheck className="size-5" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-emerald-900">Email transport connected & active</h2>
            <Badge variant="outline" className="border-emerald-300 bg-emerald-100 text-emerald-800 text-[11px]">
              Nodemailer Worker Running
            </Badge>
          </div>
          <p className="mt-1 text-sm leading-6 text-emerald-800/80">
            Outbox queue processor is operational. Broadcast campaigns, membership expiry reminders, and subscription confirmations are sent automatically.
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Subscribers</span>
            <Users className="size-4" />
          </div>
          <p className="mt-3 font-display text-3xl font-semibold">{stats.subscribers.total}</p>
          <p className="mt-1 text-xs text-muted-foreground">Registered on platform</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Confirmed</span>
            <CheckCircle className="size-4 text-emerald-600" />
          </div>
          <p className="mt-3 font-display text-3xl font-semibold text-emerald-600">{stats.subscribers.subscribed}</p>
          <p className="mt-1 text-xs text-muted-foreground">Ready to receive emails</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Opt-In</span>
            <Clock className="size-4 text-amber-600" />
          </div>
          <p className="mt-3 font-display text-3xl font-semibold text-amber-600">{stats.subscribers.pending}</p>
          <p className="mt-1 text-xs text-muted-foreground">Double opt-in sent</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Campaigns Sent</span>
            <Send className="size-4 text-primary" />
          </div>
          <p className="mt-3 font-display text-3xl font-semibold text-primary">{stats.campaigns.sent}</p>
          <p className="mt-1 text-xs text-muted-foreground">{stats.campaigns.total} total created</p>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="mt-10 flex border-b border-border">
        <button
          onClick={() => setActiveTab("campaigns")}
          className={`border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
            activeTab === "campaigns"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Email Campaigns ({campaigns.length})
        </button>
        <button
          onClick={() => setActiveTab("subscribers")}
          className={`border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
            activeTab === "subscribers"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Subscribers ({subscribers.length})
        </button>
        <button
          onClick={() => setActiveTab("announcements")}
          className={`border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
            activeTab === "announcements"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Announcements Feed ({announcements.length})
        </button>
      </div>

      {/* Tab 1: Campaigns */}
      {activeTab === "campaigns" && (
        <section className="mt-6" aria-label="Campaigns list">
          {campaignsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-16 rounded-xl" />
            </div>
          ) : campaigns.length === 0 ? (
            <ContentState
              title="No email campaigns created yet"
              description="Compose your first promotional newsletter or announcement broadcast."
              actionLabel="Compose Campaign"
              action={() => window.location.assign("/manage/newsletter/campaigns/new")}
            />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-secondary/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left">Subject</th>
                    <th scope="col" className="px-6 py-3 text-left">Status</th>
                    <th scope="col" className="px-6 py-3 text-left">Date</th>
                    <th scope="col" className="px-6 py-3 text-center">Recipients</th>
                    <th scope="col" className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {campaigns.map((camp) => (
                    <tr key={camp.id} className="transition-colors hover:bg-secondary/20">
                      <td className="px-6 py-4 font-semibold text-foreground">
                        {camp.subject}
                        <div className="text-xs font-normal text-muted-foreground line-clamp-1">
                          {camp.bodyMd}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={camp.status === "SENT" ? "default" : "secondary"}
                          className={
                            camp.status === "SENT"
                              ? "bg-emerald-600 hover:bg-emerald-600"
                              : camp.status === "SENDING"
                              ? "bg-primary text-white"
                              : "bg-muted text-foreground"
                          }
                        >
                          {camp.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {camp.sentAt
                          ? new Date(camp.sentAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : new Date(camp.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                      </td>
                      <td className="px-6 py-4 text-center font-mono text-xs">
                        {camp.sentCount || 0}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {camp.status === "DRAFT" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={sendingId === camp.id}
                            onClick={() => handleSendCampaign(camp.id)}
                            className="gap-1 text-xs"
                          >
                            <Send className="size-3" />
                            {sendingId === camp.id ? "Sending..." : "Send Now"}
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Tab 2: Subscribers */}
      {activeTab === "subscribers" && (
        <section className="mt-6" aria-label="Subscribers list">
          {subscribersLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-16 rounded-xl" />
            </div>
          ) : subscribers.length === 0 ? (
            <ContentState
              title="No subscribers found"
              description="Subscribers will appear here when users sign up via the newsletter opt-in."
            />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-secondary/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left">Name</th>
                    <th scope="col" className="px-6 py-3 text-left">Email</th>
                    <th scope="col" className="px-6 py-3 text-left">Status</th>
                    <th scope="col" className="px-6 py-3 text-right">Subscribed Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {subscribers.map((sub) => (
                    <tr key={sub.id} className="transition-colors hover:bg-secondary/20">
                      <td className="px-6 py-4 font-semibold text-foreground">{sub.name}</td>
                      <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{sub.email}</td>
                      <td className="px-6 py-4">
                        <Badge
                          variant="outline"
                          className={
                            sub.status === "SUBSCRIBED"
                              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                              : sub.status === "PENDING_CONFIRMATION"
                              ? "border-amber-300 bg-amber-50 text-amber-700"
                              : "border-border bg-muted text-muted-foreground"
                          }
                        >
                          {sub.status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right text-xs text-muted-foreground">
                        {new Date(sub.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Tab 3: Announcements */}
      {activeTab === "announcements" && (
        <section className="mt-6" aria-label="Announcements list">
          {announcementsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-16 rounded-xl" />
            </div>
          ) : announcements.length === 0 ? (
            <ContentState
              title="Nothing has been published yet"
              description="Create an announcement to share with the community."
              actionLabel="Create announcement"
              action={() => window.location.assign("/manage/announcements/new")}
            />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-secondary/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left">Published</th>
                    <th scope="col" className="px-6 py-3 text-left">Announcement</th>
                    <th scope="col" className="px-6 py-3 text-right">Audience</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {announcements.map((announcement) => (
                    <tr key={announcement.id} className="transition-colors hover:bg-secondary/20">
                      <td className="whitespace-nowrap px-6 py-4 text-xs text-muted-foreground">
                        {announcement.publishedAt || announcement.createdAt
                          ? new Date(announcement.publishedAt || announcement.createdAt).toLocaleDateString(
                              undefined,
                              { month: "short", day: "numeric", year: "numeric" }
                            )
                          : "Unavailable"}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          to={"/announcements/" + announcement.id}
                          className="font-medium text-primary underline-offset-4 hover:underline"
                        >
                          {announcement.title}
                        </Link>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {announcement.author?.name ? "By " + announcement.author.name : "Official update"}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium">
                          {announcement.audience === "MEMBERS" ? "Members" : "Public"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
