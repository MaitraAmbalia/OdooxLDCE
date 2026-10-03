import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";

export default function AnnouncementDetail() {
  const { id } = useParams();

  const { data: announcementData, isLoading } = useQuery({
    queryKey: ['announcements', id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/announcements/${id}`);
      if (!res.ok) throw new Error("Failed to fetch announcement");
      return res.json();
    }
  });

  if (isLoading) return <div className="p-12 text-center text-[var(--color-muted)]">Loading announcement...</div>;
  if (!announcementData?.data) return <div className="p-12 text-center text-[var(--color-stop)]">Announcement not found.</div>;

  const announcement = announcementData.data;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link to="/announcements" className="text-sm font-medium text-[var(--color-dusk)] hover:underline inline-block mb-4">
          &larr; Back to Feed
        </Link>
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-3xl md:text-4xl font-display font-extrabold text-[var(--color-ink)] leading-tight">{announcement.title}</h1>
          {announcement.audience === 'MEMBERS' && (
            <span className="bg-[var(--color-lamp)] text-[var(--color-ink)] text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-[6px] ml-4 flex-shrink-0">
              Members Only
            </span>
          )}
        </div>
        <p className="text-sm text-[var(--color-muted)]">
          Published on {new Date(announcement.publishedAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[10px] p-6 sm:p-10 shadow-sm">
        <article className="prose prose-sm sm:prose-base prose-ink max-w-none">
          <ReactMarkdown>{announcement.body}</ReactMarkdown>
        </article>

        {announcement.corrections && announcement.corrections.length > 0 && (
          <div className="mt-12 pt-8 border-t border-[var(--color-line)]">
            <h3 className="text-sm font-bold text-[var(--color-ink)] uppercase tracking-wider mb-4">Corrections</h3>
            <div className="space-y-4">
              {announcement.corrections.map((corr, idx) => (
                <div key={idx} className="bg-[var(--color-paper)] p-4 rounded-[6px] border border-[var(--color-line)] text-sm">
                  <span className="font-bold text-[var(--color-ink)] mr-2">
                    Update ({new Date(corr.updatedAt).toLocaleDateString()}):
                  </span>
                  <span className="text-[var(--color-ink)]">{corr.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-8 flex justify-center gap-4">
        <button className="text-sm font-medium text-[var(--color-ink)] hover:text-[var(--color-dusk)] flex items-center gap-2">
          Share via WhatsApp <span aria-hidden="true">&rarr;</span>
        </button>
        <button className="text-sm font-medium text-[var(--color-ink)] hover:text-[var(--color-dusk)] flex items-center gap-2">
          Copy Link <span aria-hidden="true">&rarr;</span>
        </button>
      </div>
    </div>
  );
}
