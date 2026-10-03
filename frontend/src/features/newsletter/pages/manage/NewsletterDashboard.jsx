import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MailWarning, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContentState } from "@/components/common/ContentState";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function NewsletterDashboard() {
  usePageTitle("Communications");

  const { data: announcementsData, isPending, isError, refetch } = useQuery({
    queryKey: ["announcements", { limit: 50 }],
    queryFn: async () => {
      const response = await fetch("/api/v1/announcements?limit=50", { credentials: "include" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error?.message || "Failed to fetch publishing history");
      return json;
    },
  });

  const announcements = announcementsData?.data || [];

  return (
    <div className="page-container py-12 sm:py-16">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-medium text-primary">Community outreach</p>
          <h1 className="font-display text-4xl font-semibold tracking-tight">Communications</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Review published updates and create the next message for your community.</p>
        </div>
        <Button asChild size="lg" className="w-full sm:w-auto"><Link to="/manage/announcements/new"><Plus aria-hidden="true" /> New announcement</Link></Button>
      </div>

      <div className="mt-8 flex items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
        <div className="rounded-full bg-amber-100 p-2"><MailWarning className="size-5" aria-hidden="true" /></div>
        <div><h2 className="font-semibold">Email campaigns are not connected yet</h2><p className="mt-1 text-sm leading-6 text-amber-900/80">Announcements publish to the website feed. Subscriber counts, delivery, and open-rate reporting will appear here once an email service is configured.</p></div>
      </div>

      <section className="mt-8" aria-labelledby="publishing-history-heading">
        <div className="mb-4">
          <h2 id="publishing-history-heading" className="font-display text-2xl font-semibold">Publishing history</h2>
          <p className="mt-1 text-sm text-muted-foreground">Recent announcements visible in the updates feed.</p>
        </div>

        {isPending ? (
          <div className="space-y-4" role="status" aria-label="Loading publishing history"><Skeleton className="h-20 rounded-2xl" /><Skeleton className="h-20 rounded-2xl" /><Skeleton className="h-20 rounded-2xl" /></div>
        ) : isError ? (
          <ContentState error title="Publishing history isn’t available." description="We couldn’t load recent announcements." action={refetch} />
        ) : announcements.length === 0 ? (
          <ContentState title="Nothing has been published yet." description="Create the first announcement to begin your communications history." actionLabel="Create announcement" action={() => window.location.assign("/manage/announcements/new")} />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="divide-y divide-border md:hidden">
              {announcements.map((announcement) => (
                <Link key={announcement.id} to={"/announcements/" + announcement.id} className="block p-5 transition-colors hover:bg-secondary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
                  <div className="flex items-start justify-between gap-3"><h3 className="font-medium">{announcement.title}</h3><span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium">{announcement.audience === "MEMBERS" ? "Members" : "Public"}</span></div>
                  <p className="mt-3 text-xs text-muted-foreground">{announcement.publishedAt || announcement.createdAt ? new Date(announcement.publishedAt || announcement.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "Publication date unavailable"}</p>
                </Link>
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-secondary/40"><tr><th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Published</th><th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Announcement</th><th scope="col" className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider">Audience</th></tr></thead>
                <tbody className="divide-y divide-border">
                  {announcements.map((announcement) => (
                    <tr key={announcement.id} className="transition-colors hover:bg-secondary/30">
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">{announcement.publishedAt || announcement.createdAt ? new Date(announcement.publishedAt || announcement.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "Unavailable"}</td>
                      <td className="px-6 py-4"><Link to={"/announcements/" + announcement.id} className="font-medium text-primary underline-offset-4 hover:underline">{announcement.title}</Link><p className="mt-1 text-xs text-muted-foreground">{announcement.author?.name ? "By " + announcement.author.name : "Official update"}</p></td>
                      <td className="whitespace-nowrap px-6 py-4 text-right"><span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium">{announcement.audience === "MEMBERS" ? "Members" : "Public"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
