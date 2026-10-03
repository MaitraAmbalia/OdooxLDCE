import React from "react";
import { Sprout } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

export default function SelectionHub() {
  const { data: cyclesData, isLoading } = useQuery({
    queryKey: ['selection', 'cycles'],
    queryFn: async () => {
      // API endpoint: GET /selection/cycles
      const res = await fetch("/api/v1/selection/cycles");
      if (!res.ok) throw new Error("Failed to fetch selection cycles");
      return res.json();
    }
  });

  const cycles = cyclesData?.data || [];
  const openCycles = cycles.filter(c => c.status === 'PUBLISHED' && new Date(c.deadlineAt) > new Date());
  const closedCycles = cycles.filter(c => c.status === 'CLOSED' || new Date(c.deadlineAt) <= new Date());

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-display font-extrabold text-[var(--color-ink)] mb-4">Leadership Selection</h1>
        <p className="text-lg text-[var(--color-muted)] max-w-2xl mx-auto">
          Step up and lead. Browse open positions for upcoming terms and apply to be part of the Skyline Student Association executive board.
        </p>
      </div>

      <div className="space-y-12">
        {isLoading ? (
          <div className="text-center py-20 text-[var(--color-muted)]">Loading available positions...</div>
        ) : openCycles.length === 0 ? (
          <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[10px] p-12 text-center shadow-sm">
            <Sprout className="w-10 h-10 mb-4 block text-blue-600" aria-hidden="true" />
            <h2 className="text-xl font-bold text-[var(--color-ink)] mb-2">No Open Recruitments</h2>
            <p className="text-[var(--color-muted)]">There are currently no active selection cycles. Check back later!</p>
          </div>
        ) : (
          openCycles.map(cycle => (
            <div key={cycle.id} className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[10px] overflow-hidden shadow-sm">
              <div className="p-6 sm:p-8 bg-[var(--color-paper)] border-b border-[var(--color-line)] flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-display font-bold text-[var(--color-ink)]">{cycle.name}</h2>
                    <span className="bg-[var(--color-ok)] text-white text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded">Accepting Applications</span>
                  </div>
                  <p className="text-sm text-[var(--color-muted)]">Term: {cycle.termStart} to {cycle.termEnd}</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-[6px] border border-[var(--color-line)] text-center md:text-right">
                  <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider mb-1">Deadline</p>
                  <p className="text-sm font-bold text-[var(--color-stop)]">
                    {new Date(cycle.deadlineAt).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="p-6 sm:p-8">
                <h3 className="text-sm font-bold text-[var(--color-ink)] uppercase tracking-wider mb-6">Open Positions ({cycle.posts?.length || 0})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cycle.posts?.map(post => (
                    <div key={post.id} className="border border-[var(--color-line)] rounded-[6px] p-5 hover:border-[var(--color-dusk)] transition-colors flex flex-col h-full">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-[var(--color-ink)] text-lg">{post.title}</h4>
                        <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">{post.capacity} slot{post.capacity > 1 ? 's' : ''}</span>
                      </div>
                      <p className="text-sm text-[var(--color-muted)] mb-6 flex-1">{post.description}</p>
                      <Link
                        to={`/selection/posts/${post.id}/apply`}
                        className="block w-full text-center bg-[var(--color-dusk)] text-white py-2 rounded-[6px] text-sm font-medium hover:bg-opacity-90 transition-opacity"
                      >
                        Apply for {post.title}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}

        {closedCycles.length > 0 && (
          <div className="pt-8">
            <h3 className="text-xl font-display font-bold text-[var(--color-ink)] mb-6">Past Cycles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {closedCycles.map(cycle => (
                <div key={cycle.id} className="bg-[var(--color-paper)] border border-[var(--color-line)] p-4 rounded-[6px] opacity-75 grayscale hover:grayscale-0 transition-all">
                  <h4 className="font-bold text-[var(--color-ink)]">{cycle.name}</h4>
                  <p className="text-xs text-[var(--color-muted)] mt-1">Closed {new Date(cycle.deadlineAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
