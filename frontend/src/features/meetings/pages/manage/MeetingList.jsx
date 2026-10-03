import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

export default function MeetingList() {
  const { data: meetingsData, isLoading } = useQuery({
    queryKey: ['meetings'],
    queryFn: async () => {
      // API endpoint: GET /meetings
      const res = await fetch("/api/v1/meetings");
      if (!res.ok) throw new Error("Failed to fetch meetings");
      return res.json();
    }
  });

  const meetings = meetingsData?.data || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-display font-extrabold text-[var(--color-ink)]">Meetings</h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">Schedule and manage association meetings and agendas.</p>
        </div>
        <Link to="/manage/meetings/new" className="bg-[var(--color-dusk)] text-white px-4 py-2 rounded-[6px] text-sm font-medium hover:bg-opacity-90 transition-opacity">
          + Schedule Meeting
        </Link>
      </div>

      <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[10px] overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-[var(--color-line)]">
          <thead className="bg-[var(--color-paper)]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-ink)] uppercase tracking-wider">Date & Time</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-ink)] uppercase tracking-wider">Title & Location</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-ink)] uppercase tracking-wider">Audience</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-[var(--color-ink)] uppercase tracking-wider">RSVPs</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-line)] bg-white">
            {isLoading ? (
              <tr><td colSpan="4" className="p-8 text-center text-[var(--color-muted)]">Loading meetings...</td></tr>
            ) : meetings.length === 0 ? (
              <tr><td colSpan="4" className="p-12 text-center text-[var(--color-muted)]">No meetings scheduled.</td></tr>
            ) : meetings.map(meeting => (
              <tr key={meeting.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <p className="text-sm font-bold text-[var(--color-ink)]">
                    {new Date(meeting.scheduledAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  <p className="text-xs text-[var(--color-muted)] mt-1">
                    {new Date(meeting.scheduledAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <Link to={`/manage/meetings/${meeting.id}`} className="text-sm font-bold text-[var(--color-dusk)] hover:underline">
                    {meeting.title}
                  </Link>
                  <p className="text-xs text-[var(--color-muted)] mt-1">{meeting.location}</p>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--color-paper)] text-[var(--color-ink)] border border-[var(--color-line)]">
                    {meeting.audienceType}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex justify-end gap-2 text-sm font-mono">
                    <span className="text-[var(--color-ok)]" title="Attending">{meeting.rsvpCounts?.yes || 0}</span>
                    <span className="text-[var(--color-muted)]">/</span>
                    <span className="text-[var(--color-ink)]" title="Invited">{meeting.rsvpCounts?.total || 0}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
