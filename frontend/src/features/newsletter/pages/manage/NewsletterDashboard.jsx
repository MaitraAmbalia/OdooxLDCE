import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

export default function NewsletterDashboard() {
  const { data: newsletterData, isLoading } = useQuery({
    queryKey: ['newsletter'],
    queryFn: async () => {
      // API endpoint: GET /newsletter/campaigns (and stats)
      const res = await fetch("/api/v1/newsletter/campaigns");
      if (!res.ok) throw new Error("Failed to fetch newsletter data");
      return res.json();
    }
  });

  const campaigns = newsletterData?.data?.campaigns || [];
  const stats = newsletterData?.data?.stats || { totalSubscribers: 0, openRate: 0 };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-display font-extrabold text-[var(--color-ink)]">Newsletter Campaigns</h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">Manage email blasts sent to subscribers.</p>
        </div>
        <Link to="/manage/announcements/new" className="bg-[var(--color-dusk)] text-white px-4 py-2 rounded-[6px] text-sm font-medium hover:bg-opacity-90">
          Compose New
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[var(--color-surface)] border border-[var(--color-line)] p-6 rounded-[10px] shadow-sm">
          <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider mb-2">Total Subscribers</p>
          <p className="text-3xl font-display font-bold font-mono tabular-nums text-[var(--color-ink)]">
            {stats.totalSubscribers.toLocaleString()}
          </p>
        </div>
        <div className="bg-[var(--color-surface)] border border-[var(--color-line)] p-6 rounded-[10px] shadow-sm">
          <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider mb-2">Avg. Open Rate</p>
          <p className="text-3xl font-display font-bold font-mono tabular-nums text-[var(--color-ink)]">
            {stats.openRate}%
          </p>
        </div>
      </div>

      <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[10px] overflow-hidden shadow-sm">
        <div className="p-4 bg-[var(--color-paper)] border-b border-[var(--color-line)]">
          <h2 className="text-sm font-semibold text-[var(--color-ink)]">Past Campaigns</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--color-line)]">
            <thead className="bg-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-ink)] uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-ink)] uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-[var(--color-ink)] uppercase tracking-wider">Recipients</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-line)] bg-white">
              {isLoading ? (
                <tr><td colSpan="3" className="p-8 text-center text-[var(--color-muted)]">Loading campaigns...</td></tr>
              ) : campaigns.length === 0 ? (
                <tr><td colSpan="3" className="p-12 text-center text-[var(--color-muted)]">No campaigns sent yet.</td></tr>
              ) : campaigns.map(camp => (
                <tr key={camp.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-muted)]">
                    {new Date(camp.sentAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-[var(--color-ink)]">
                    {camp.subject}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-mono text-[var(--color-ink)]">
                    {camp.recipientCount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
