import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContentState } from "@/components/common/ContentState";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function AnnouncementDetail() {
  const { id } = useParams();
  const [copied, setCopied] = useState(false);

  const { data: announcementData, isPending, isError, refetch } = useQuery({
    queryKey: ['announcements', id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/announcements/${id}`);
      if (!res.ok) throw new Error("Failed to fetch announcement");
      return res.json();
    }
  });

  const announcement = announcementData?.data;
  usePageTitle(announcement?.title || "Update");

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  if (isPending) return <div className="page-container max-w-3xl py-12" role="status" aria-label="Loading update"><Skeleton className="h-5 w-32" /><Skeleton className="mt-8 h-12 w-4/5" /><Skeleton className="mt-4 h-5 w-52" /><Skeleton className="mt-10 h-80 w-full rounded-2xl" /></div>;
  if (isError || !announcement) return <div className="page-container py-16"><ContentState error title="We couldn’t find that update." description="It may have moved or is temporarily unavailable." action={refetch} /></div>;

  return (
    <article className="page-container max-w-3xl py-12 sm:py-16">
      <div className="mb-8">
        <Link to="/announcements" className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
          <ArrowLeft className="size-4" aria-hidden="true" /> All updates
        </Link>
        <div className="flex justify-between items-start mb-4">
          <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">{announcement.title}</h1>
          {announcement.audience === 'MEMBERS' && (
            <span className="ml-4 shrink-0 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-primary">
              Members only
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Published on {new Date(announcement.publishedAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 sm:p-10">
        <article className="prose prose-sm sm:prose-base prose-ink max-w-none">
          <ReactMarkdown>{announcement.body}</ReactMarkdown>
        </article>

        {announcement.corrections && announcement.corrections.length > 0 && (
          <div className="mt-12 border-t border-border pt-8">
            <h3 className="mb-4 font-display text-lg font-semibold">Updates and corrections</h3>
            <div className="space-y-4">
              {announcement.corrections.map((corr, idx) => (
                <div key={idx} className="rounded-xl border border-border bg-secondary/50 p-4 text-sm leading-6">
                  <span className="mr-2 font-semibold">
                    Update ({new Date(corr.updatedAt).toLocaleDateString()}):
                  </span>
                  <span className="text-muted-foreground">{corr.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 flex gap-3 border-t border-border pt-6">
        <Button asChild variant="outline">
          <a href={`https://wa.me/?text=${encodeURIComponent(`${announcement.title} ${window.location.href}`)}`} target="_blank" rel="noreferrer">Share on WhatsApp</a>
        </Button>
        <Button variant="outline" onClick={copyLink} aria-live="polite">
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          {copied ? "Link copied" : "Copy link"}
        </Button>
      </div>
    </article>
  );
}
