import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

export default function AnnouncementFeed() {
  const { data: announcementsData, isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const res = await fetch("/api/v1/announcements");
      if (!res.ok) throw new Error("Failed to fetch announcements");
      return res.json();
    }
  });

  const announcements = announcementsData?.data || [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-extrabold text-[var(--color-ink)]">Announcements</h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">Official updates from the Skyline Student Association.</p>
      </div>

      <div className="space-y-6">
        {isLoading ? (
          <div className="text-center py-12 text-[var(--color-muted)]">Loading announcements...</div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-12 bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[10px]">
            <p className="text-[var(--color-muted)]">No announcements published yet.</p>
          </div>
        ) : announcements.map(announcement => (
          <Link 
            key={announcement.id} 
            to={`/announcements/${announcement.id}`}
            className="block bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[10px] p-6 hover:shadow-sm transition-shadow"
          >
            <div className="flex justify-between items-start mb-3">
              <h2 className="text-xl font-display font-bold text-[var(--color-ink)]">{announcement.title}</h2>
              {announcement.audience === 'MEMBERS' && (
                <span className="bg-[var(--color-lamp)] text-[var(--color-ink)] text-xs font-bold uppercase tracking-wider px-2 py-1 rounded">Members Only</span>
              )}
            </div>
            <p className="text-sm text-[var(--color-ink)] line-clamp-3 mb-4">
              {announcement.bodySummary || announcement.body}
            </p>
            <div className="flex items-center justify-between text-xs text-[var(--color-muted)]">
              <span>{new Date(announcement.publishedAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              <span className="text-[var(--color-dusk)] font-medium group-hover:underline">Read more &rarr;</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
