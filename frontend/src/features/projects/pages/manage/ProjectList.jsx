import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

export default function ProjectList() {
  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      // API endpoint: GET /projects
      const res = await fetch("/api/v1/projects");
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json();
    }
  });

  const projects = projectsData?.data || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-display font-extrabold text-[var(--color-ink)]">Projects Portfolio</h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">Manage events, tasks, and budgets across active projects.</p>
        </div>
        <button className="bg-[var(--color-dusk)] text-white px-4 py-2 rounded-[6px] text-sm font-medium hover:bg-opacity-90">
          + New Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full p-8 text-center text-[var(--color-muted)]">Loading projects...</div>
        ) : projects.map(proj => (
          <Link key={proj.id} to={`/manage/projects/${proj.id}`} className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[10px] p-6 hover:shadow-md transition-shadow flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-display font-bold text-[var(--color-ink)]">{proj.name}</h2>
              <span className={`px-2 py-1 text-xs font-bold uppercase rounded ${
                proj.status === 'DONE' ? 'bg-[var(--color-ok)] text-white' :
                proj.status === 'IN_PROGRESS' ? 'bg-[var(--color-info)] text-white' :
                'bg-[var(--color-neutral)] text-white'
              }`}>
                {proj.status.replace('_', ' ')}
              </span>
            </div>

            <div className="mb-6 flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-[var(--color-muted)]">Task Progress</span>
                <span className="font-bold text-[var(--color-ink)]">{proj.progress}%</span>
              </div>
              <div className="w-full h-2 bg-[var(--color-line)] rounded-full overflow-hidden">
                <div 
                  className={`h-full ${proj.progress === 100 ? 'bg-[var(--color-ok)]' : 'bg-[var(--color-dusk)]'}`}
                  style={{ width: `${proj.progress}%` }}
                ></div>
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--color-line)]">
              <div className="flex justify-between text-sm">
                <div>
                  <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider">Budget Spent</p>
                  <p className="font-mono font-bold text-[var(--color-ink)]">
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(proj.spentPaise / 100)}
                    <span className="text-[var(--color-muted)] font-normal text-xs ml-1">
                      / {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(proj.totalBudgetPaise / 100)}
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider">Target Date</p>
                  <p className="font-medium text-[var(--color-ink)]">{new Date(proj.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
