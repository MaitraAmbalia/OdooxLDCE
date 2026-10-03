import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

export default function ApplicationReview() {
  const { id } = useParams();
  const [selectedPost, setSelectedPost] = useState("ALL");
  const [selectedApp, setSelectedApp] = useState(null); // Used to open a detail drawer

  const { data: appsData, isLoading } = useQuery({
    queryKey: ['selection', 'cycles', id, 'applications'],
    queryFn: async () => {
      // API endpoint: GET /selection/cycles/:id/applications
      const res = await fetch(`/api/v1/selection/cycles/${id}/applications`);
      if (!res.ok) throw new Error("Failed to fetch applications");
      return res.json();
    }
  });

  const applications = appsData?.data || [];

  // Get unique posts for filter
  const uniquePosts = [...new Set(applications.map(app => app.post.title))];

  const filteredApps = selectedPost === 'ALL'
    ? applications
    : applications.filter(app => app.post.title === selectedPost);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 relative">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-display font-extrabold text-[var(--color-ink)]">Application Review</h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">Review candidates and manage appointments.</p>
        </div>
        <select
          value={selectedPost}
          onChange={e => setSelectedPost(e.target.value)}
          className="px-4 py-2 border border-[var(--color-line)] rounded-[6px] text-sm font-medium bg-white focus:outline-none focus:border-[var(--color-dusk)]"
        >
          <option value="ALL">All Positions</option>
          {uniquePosts.map(post => (
            <option key={post} value={post}>{post}</option>
          ))}
        </select>
      </div>

      <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[10px] overflow-hidden shadow-sm min-h-[500px]">
        <table className="min-w-full divide-y divide-[var(--color-line)]">
          <thead className="bg-[var(--color-paper)]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-ink)] uppercase tracking-wider">Applicant</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-ink)] uppercase tracking-wider">Position</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-ink)] uppercase tracking-wider">Submitted</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-[var(--color-ink)] uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-line)] bg-white">
            {isLoading ? (
              <tr><td colSpan="4" className="p-8 text-center text-[var(--color-muted)]">Loading applications...</td></tr>
            ) : filteredApps.length === 0 ? (
              <tr><td colSpan="4" className="p-12 text-center text-[var(--color-muted)]">No applications match your criteria.</td></tr>
            ) : filteredApps.map(app => (
              <tr
                key={app.id}
                onClick={() => setSelectedApp(app)}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <p className="text-sm font-bold text-[var(--color-ink)]">{app.user?.name}</p>
                  <p className="text-xs text-[var(--color-muted)] mt-1 font-mono">{app.user?.studentId}</p>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <p className="text-sm font-medium text-[var(--color-ink)]">{app.post.title}</p>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-muted)]">
                  {new Date(app.submittedAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span className={`inline-flex px-2 py-1 text-[10px] font-bold uppercase rounded ${
                    app.status === 'APPOINTED' ? 'bg-[var(--color-ok)] text-white' :
                    app.status === 'REJECTED' ? 'bg-[var(--color-stop)] text-white' :
                    app.status === 'INTERVIEW' ? 'bg-[var(--color-info)] text-white' :
                    'bg-[var(--color-line)] text-[var(--color-ink)]'
                  }`}>
                    {app.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Drawer overlay */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setSelectedApp(null)}></div>
          <div className="fixed inset-y-0 right-0 max-w-full flex">
            <div className="w-screen max-w-md bg-white shadow-xl h-full flex flex-col">
              <div className="p-6 border-b border-[var(--color-line)] flex justify-between items-start bg-[var(--color-paper)]">
                <div>
                  <h2 className="text-xl font-display font-bold text-[var(--color-ink)]">{selectedApp.user?.name}</h2>
                  <p className="text-sm text-[var(--color-muted)] mt-1">Applying for: <strong>{selectedApp.post.title}</strong></p>
                </div>
                <button onClick={() => setSelectedApp(null)} className="text-gray-400 hover:text-gray-500">
                  <span className="text-2xl">&times;</span>
                </button>
              </div>
              <div className="p-6 flex-1 overflow-y-auto">
                <h3 className="font-bold text-[var(--color-ink)] mb-4">Application Answers</h3>
                <div className="space-y-6">
                  {selectedApp.answers && Object.entries(selectedApp.answers).map(([qId, ans], idx) => (
                    <div key={qId} className="bg-gray-50 p-4 rounded-[6px] border border-[var(--color-line)]">
                      <p className="text-xs font-bold text-[var(--color-muted)] uppercase mb-2">Q{idx + 1}: {qId}</p>
                      <p className="text-sm text-[var(--color-ink)] whitespace-pre-wrap">{ans}</p>
                    </div>
                  ))}
                  {(!selectedApp.answers || Object.keys(selectedApp.answers).length === 0) && (
                    <p className="text-sm text-[var(--color-muted)]">No answers provided.</p>
                  )}
                </div>
              </div>
              <div className="p-6 border-t border-[var(--color-line)] bg-[var(--color-paper)] flex flex-col gap-3">
                <p className="text-xs font-bold text-[var(--color-muted)] uppercase mb-1">Update Status</p>
                <div className="flex gap-2">
                  <button className="flex-1 py-2 text-xs font-bold uppercase rounded border border-[var(--color-info)] text-[var(--color-info)] hover:bg-blue-50">Interview</button>
                  <button className="flex-1 py-2 text-xs font-bold uppercase rounded border border-[var(--color-ok)] text-[var(--color-ok)] hover:bg-green-50">Appoint</button>
                  <button className="flex-1 py-2 text-xs font-bold uppercase rounded border border-[var(--color-stop)] text-[var(--color-stop)] hover:bg-red-50">Reject</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
