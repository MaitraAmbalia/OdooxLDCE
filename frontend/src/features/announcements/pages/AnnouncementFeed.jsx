import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, CalendarDays, LockKeyhole } from "lucide-react";
import { Link } from "react-router-dom";
import { ContentState } from "@/components/common/ContentState";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function AnnouncementFeed() {
  usePageTitle("Latest updates");
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const response = await fetch("/api/v1/announcements");
      if (!response.ok) throw new Error("Failed to fetch announcements");
      return response.json();
    },
  });
  const announcements = data?.data || [];

  return (
    <section className="page-container py-12 sm:py-16" aria-labelledby="updates-title">
      <div className="mb-10 max-w-2xl">
        <p className="mb-3 text-sm font-medium text-primary">From Skyline</p>
        <h1 id="updates-title" className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">News worth knowing.</h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">Official updates, opportunities, and useful notes from your student community.</p>
      </div>

      {isPending ? (
        <div className="grid gap-5 md:grid-cols-2" role="status" aria-label="Loading updates">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="rounded-2xl border border-border bg-card p-6">
              <Skeleton className="h-4 w-28" /><Skeleton className="mt-5 h-7 w-4/5" />
              <Skeleton className="mt-3 h-4 w-full" /><Skeleton className="mt-2 h-4 w-3/4" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <ContentState error title="Updates are taking a little longer." description="We couldn’t load the feed. Try again in a moment." action={refetch} />
      ) : announcements.length === 0 ? (
        <ContentState title="Nothing new—yet." description="Official updates will appear here as soon as they are published." />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {announcements.map((announcement) => (
          <Link
            key={announcement.id}
            to={`/announcements/${announcement.id}`}
            className="group flex min-h-64 flex-col rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
          >
            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><CalendarDays className="size-3.5" aria-hidden="true" />{new Date(announcement.publishedAt).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}</span>
              {announcement.audience === "MEMBERS" ? <span className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 font-medium text-primary"><LockKeyhole className="size-3" aria-hidden="true" /> Members</span> : null}
            </div>
            <h2 className="mt-6 font-display text-2xl font-semibold tracking-tight group-hover:text-primary">{announcement.title}</h2>
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{announcement.bodySummary || announcement.body}</p>
            <span className="mt-auto flex items-center justify-between border-t border-border pt-5 text-sm font-medium text-primary">Read update <ArrowUpRight className="size-4" aria-hidden="true" /></span>
          </Link>
          ))}
        </div>
      )}
    </section>
  );
}
