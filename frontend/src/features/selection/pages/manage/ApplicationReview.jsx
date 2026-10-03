import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileSearch, X } from "lucide-react";
import { ContentState } from "@/components/common/ContentState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function ApplicationReview() {
  usePageTitle("Application review");
  const { id } = useParams();
  const [selectedPost, setSelectedPost] = useState("ALL");
  const [selectedApp, setSelectedApp] = useState(null); // Used to open a detail drawer

  const { data: appsData, isPending, isError, refetch } = useQuery({
    queryKey: ['selection', 'cycles', id, 'applications'],
    queryFn: async () => {
      // API endpoint: GET /selection/cycles/:id/applications
      const res = await fetch(`/api/v1/selection/cycles/${id}/applications`, { credentials: 'include' });
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

  const queryClient = useQueryClient();
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const res = await fetch(`/api/v1/selection/applications/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || "Failed to update application");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['selection', 'cycles', id, 'applications']);
      setSelectedApp(null);
    }
  });

  return (
    <div className="page-container relative py-12 sm:py-16">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-sm font-medium text-primary">Selection workspace</p>
          <h1 className="font-display text-4xl font-semibold tracking-tight">Application review</h1>
          <p className="mt-2 text-sm text-muted-foreground">Compare candidates and review their responses.</p>
        </div>
        <label className="text-sm font-medium"><span className="sr-only">Filter by position</span>
        <select
          value={selectedPost}
          onChange={e => setSelectedPost(e.target.value)}
          className="h-10 rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="ALL">All positions</option>
          {uniquePosts.map(post => (
            <option key={post} value={post}>{post}</option>
          ))}
        </select>
        </label>
      </div>

      {isPending ? (
        <div className="space-y-3" role="status" aria-label="Loading applications"><Skeleton className="h-14 rounded-xl" /><Skeleton className="h-20 rounded-xl" /><Skeleton className="h-20 rounded-xl" /></div>
      ) : isError ? (
        <ContentState error title="Applications aren’t available right now." description="The review queue couldn’t be loaded." action={refetch} />
      ) : filteredApps.length === 0 ? (
        <ContentState title="No applications match this view." description="Try another position or return when candidates have submitted applications." />
      ) : (
      <div className="min-h-[420px] overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-secondary/40">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Applicant</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Position</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Submitted</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {filteredApps.map(app => (
              <tr
                key={app.id}
                onClick={() => setSelectedApp(app)}
                tabIndex={0}
                onKeyDown={(event) => { if (event.key === "Enter") setSelectedApp(app); }}
                className="cursor-pointer transition-colors hover:bg-secondary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <p className="text-sm font-semibold">{app.user?.name || "Unnamed applicant"}</p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">{app.user?.studentId}</p>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <p className="text-sm font-medium">{app.post?.title || "Leadership role"}</p>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
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
      )}

      {/* Detail Drawer overlay */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-[#20243b]/55 backdrop-blur-sm" onClick={() => setSelectedApp(null)}></div>
          <div className="fixed inset-y-0 right-0 max-w-full flex">
            <div className="flex h-full w-screen max-w-md flex-col bg-card shadow-xl">
              <div className="flex items-start justify-between border-b border-border bg-secondary/40 p-6">
                <div>
                  <h2 id="slide-over-title" className="font-display text-2xl font-semibold">{selectedApp.user?.name || "Applicant"}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Applying for <strong className="text-foreground">{selectedApp.post?.title}</strong></p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedApp(null)} aria-label="Close application"><X aria-hidden="true" /></Button>
              </div>
              <div className="p-6 flex-1 overflow-y-auto">
                
                <div className="mb-6 rounded-xl border border-border bg-secondary/30 p-4">
                   <h3 className="mb-2 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Contact Details</h3>
                   <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Student ID:</span> {selectedApp.user?.studentId}</p>
                      <p><span className="font-medium">Email:</span> <a href={`mailto:${selectedApp.user?.email}`} className="text-primary hover:underline">{selectedApp.user?.email}</a></p>
                   </div>
                </div>

                <h3 className="mb-4 font-display text-lg font-semibold">Application answers</h3>
                <div className="space-y-6">
                  {selectedApp.answers && Object.entries(selectedApp.answers).map(([qId, ans], idx) => (
                    <div key={qId} className="rounded-xl border border-border bg-secondary/30 p-4">
                      <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Question {idx + 1}</p>
                      <p className="whitespace-pre-wrap text-sm leading-6">{String(ans)}</p>
                    </div>
                  ))}
                  {(!selectedApp.answers || Object.keys(selectedApp.answers).length === 0) && (
                    <div className="py-10 text-center text-sm text-muted-foreground"><FileSearch className="mx-auto mb-3 size-8 text-primary/50" />No answers provided.</div>
                  )}
                </div>
              </div>
              <div className="border-t border-border bg-secondary/30 p-6">
                {selectedApp.status !== 'APPOINTED' && selectedApp.status !== 'REJECTED' ? (
                  <div className="flex gap-4">
                    <Button 
                      variant="outline" 
                      className="flex-1 border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => updateStatusMutation.mutate({ id: selectedApp.id, status: 'REJECTED' })}
                      disabled={updateStatusMutation.isPending}
                    >
                      Decline
                    </Button>
                    <Button 
                      className="flex-1 bg-[var(--color-ok)] hover:bg-[#3b6050]"
                      onClick={() => updateStatusMutation.mutate({ id: selectedApp.id, status: 'APPOINTED' })}
                      disabled={updateStatusMutation.isPending}
                    >
                      Accept & Appoint
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm font-medium text-center">Application has been {selectedApp.status.toLowerCase()}.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
