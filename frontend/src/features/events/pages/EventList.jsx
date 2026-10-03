import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

export default function EventList() {
  const { data: eventsData, isLoading, error } = useQuery({
    queryKey: ['events', 'list'],
    queryFn: async () => {
      // API endpoint: GET /events
      const res = await fetch("/api/v1/events");
      if (!res.ok) throw new Error("Failed to fetch events");
      return res.json();
    }
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-display font-extrabold text-[var(--color-ink)]">Upcoming Events</h1>
      </div>

      {isLoading ? (
        <div className="text-[var(--color-muted)]">Loading events...</div>
      ) : error ? (
        <div className="text-[var(--color-stop)]">Error loading events.</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {eventsData?.data?.map((event) => (
            <Link 
              key={event.id} 
              to={`/events/${event.id}`}
              className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[10px] overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="h-48 bg-gray-200">
                {event.coverImageUrl ? (
                  <img src={event.coverImageUrl} alt={event.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[var(--color-line)] flex items-center justify-center text-[var(--color-muted)]">
                    No cover image
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-lg font-display font-bold text-[var(--color-ink)]">{event.title}</h3>
                <p className="text-sm text-[var(--color-muted)] mt-1">
                  {new Date(event.startDate).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' })}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--color-paper)] text-[var(--color-ink)] border border-[var(--color-line)]">
                    {event.category || "General"}
                  </span>
                </div>
              </div>
            </Link>
          ))}
          {(!eventsData?.data || eventsData.data.length === 0) && (
            <div className="col-span-full py-12 text-center text-[var(--color-muted)]">
              No upcoming events found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
