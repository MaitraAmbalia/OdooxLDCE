import React from "react";
import { Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

export default function VolunteerHome() {
  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', 'me'],
    queryFn: async () => {
      // API endpoint: GET /tasks/me
      const res = await fetch("/api/v1/tasks/me");
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    }
  });

  const { data: claimsData, isLoading: claimsLoading } = useQuery({
    queryKey: ['claims', 'me'],
    queryFn: async () => {
      // API endpoint: GET /claims/me
      const res = await fetch("/api/v1/claims/me");
      if (!res.ok) throw new Error("Failed to fetch claims");
      return res.json();
    }
  });

  const tasks = tasksData?.data || [];
  const claims = claimsData?.data || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-display font-extrabold text-[var(--color-ink)]">Volunteer Dashboard</h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">Manage your tasks, duties, and expense claims.</p>
        </div>
        <Link to="/volunteer/claims/new" className="bg-[var(--color-dusk)] text-white px-4 py-2 rounded-[6px] text-sm font-medium hover:bg-opacity-90 transition-opacity">
          Submit Expense Claim
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Tasks */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-bold text-[var(--color-ink)]">My Active Tasks</h2>
            <Link to="/volunteer/chats" className="text-sm text-[var(--color-dusk)] hover:underline">View all chats &rarr;</Link>
          </div>

          <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[10px] overflow-hidden">
            {tasksLoading ? (
              <div className="p-8 text-center text-[var(--color-muted)]">Loading tasks...</div>
            ) : tasks.length === 0 ? (
              <div className="p-8 text-center text-[var(--color-muted)]">You don't have any active tasks right now.</div>
            ) : (
              <ul className="divide-y divide-[var(--color-line)]">
                {tasks.map(task => (
                  <li key={task.id}>
                    <Link to={`/volunteer/tasks/${task.id}`} className="block hover:bg-[var(--color-paper)] transition-colors p-6">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-[var(--color-ink)] text-lg">{task.title}</h3>
                        <span className={`px-2 py-1 text-xs font-bold uppercase rounded ${
                          task.status === 'DONE' ? 'bg-[var(--color-ok)] text-white' :
                          task.status === 'BLOCKED' ? 'bg-[var(--color-stop)] text-white' :
                          task.status === 'IN_PROGRESS' ? 'bg-[var(--color-info)] text-white' :
                          'bg-[var(--color-neutral)] text-white'
                        }`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--color-muted)] mb-4">{task.project?.name || "General Event Task"}</p>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[var(--color-muted)] flex items-center gap-2">
                          <Calendar className="w-4 h-4 inline-block shrink-0 -mt-0.5 mr-1" aria-hidden="true" />Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}
                        </span>
                        <span className="text-[var(--color-dusk)] font-medium">Open Task & Chat &rarr;</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right Column: Claims & Duties */}
        <div className="space-y-8">

          <section>
            <h2 className="text-lg font-display font-bold text-[var(--color-ink)] mb-4">Upcoming Duties</h2>
            <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[10px] p-6 text-center">
              <p className="text-sm text-[var(--color-muted)] mb-4">No door or cash desk duties assigned for the next 7 days.</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-display font-bold text-[var(--color-ink)] mb-4">My Claims Status</h2>
            <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[10px] overflow-hidden">
              {claimsLoading ? (
                <div className="p-4 text-center text-[var(--color-muted)] text-sm">Loading claims...</div>
              ) : claims.length === 0 ? (
                <div className="p-4 text-center text-[var(--color-muted)] text-sm">No recent claims.</div>
              ) : (
                <ul className="divide-y divide-[var(--color-line)]">
                  {claims.map(claim => (
                    <li key={claim.id} className="p-4 hover:bg-[var(--color-paper)]">
                      <Link to={`/volunteer/claims/${claim.id}`} className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-[var(--color-ink)]">{claim.description}</p>
                          <p className="text-xs text-[var(--color-muted)] mt-1">{new Date(claim.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-mono font-bold">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(claim.amountPaise / 100)}</p>
                          <p className={`text-[11px] uppercase font-bold tracking-wider mt-1 ${
                            claim.status === 'PAID' || claim.status === 'APPROVED' ? 'text-[var(--color-ok)]' :
                            claim.status === 'REJECTED' ? 'text-[var(--color-stop)]' : 'text-[var(--color-wait)]'
                          }`}>{claim.status.replace('_', ' ')}</p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
