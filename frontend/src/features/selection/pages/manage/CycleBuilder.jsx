import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function CycleBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    termStart: "",
    termEnd: "",
    deadlineAt: "",
    status: "DRAFT"
  });

  const { data: cycleData, isLoading } = useQuery({
    queryKey: ['selection', 'cycles', id],
    queryFn: async () => {
      // API endpoint: GET /selection/cycles/:id
      const res = await fetch(`/api/v1/selection/cycles/${id}`);
      if (!res.ok) throw new Error("Failed to fetch cycle details");
      return res.json();
    },
    // Don't run query if id is 'new' (in a real app we'd split creation from editing)
    enabled: id !== 'new'
  });

  useEffect(() => {
    if (cycleData?.data) {
      const cycle = cycleData.data;
      setFormData({
        name: cycle.name || "",
        termStart: cycle.termStart || "",
        termEnd: cycle.termEnd || "",
        deadlineAt: cycle.deadlineAt ? new Date(cycle.deadlineAt).toISOString().slice(0,16) : "",
        status: cycle.status || "DRAFT"
      });
    }
  }, [cycleData]);

  const updateMutation = useMutation({
    mutationFn: async (payload) => {
      // API endpoint: PATCH /selection/cycles/:id
      console.log(`Updating cycle ${id}:`, payload);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['selection', 'cycles'] });
      alert("Cycle updated successfully.");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading && id !== 'new') return <div className="p-12 text-center text-[var(--color-muted)]">Loading builder...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link to="/selection" className="text-sm font-medium text-[var(--color-dusk)] hover:underline inline-block mb-2">
          &larr; Back to Selection Hub
        </Link>
        <h1 className="text-3xl font-display font-extrabold text-[var(--color-ink)]">
          {id === 'new' ? 'Create Cycle' : 'Edit Selection Cycle'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[10px] p-6 sm:p-10 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[var(--color-ink)] mb-1">Cycle Name</label>
            <input 
              type="text" 
              required
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="e.g., Executive Board 2026-2027"
              className="w-full px-3 py-2 border border-[var(--color-line)] rounded-[6px] text-sm focus:border-[var(--color-dusk)] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-ink)] mb-1">Term Start</label>
            <input 
              type="month" 
              required
              value={formData.termStart}
              onChange={e => setFormData({...formData, termStart: e.target.value})}
              className="w-full px-3 py-2 border border-[var(--color-line)] rounded-[6px] text-sm focus:border-[var(--color-dusk)] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-ink)] mb-1">Term End</label>
            <input 
              type="month" 
              required
              value={formData.termEnd}
              onChange={e => setFormData({...formData, termEnd: e.target.value})}
              className="w-full px-3 py-2 border border-[var(--color-line)] rounded-[6px] text-sm focus:border-[var(--color-dusk)] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-ink)] mb-1">Application Deadline</label>
            <input 
              type="datetime-local" 
              required
              value={formData.deadlineAt}
              onChange={e => setFormData({...formData, deadlineAt: e.target.value})}
              className="w-full px-3 py-2 border border-[var(--color-line)] rounded-[6px] text-sm focus:border-[var(--color-dusk)] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-ink)] mb-1">Status</label>
            <select 
              value={formData.status}
              onChange={e => setFormData({...formData, status: e.target.value})}
              className="w-full px-3 py-2 border border-[var(--color-line)] rounded-[6px] text-sm focus:border-[var(--color-dusk)] focus:outline-none bg-white"
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published (Open)</option>
              <option value="CLOSED">Closed (Reviewing)</option>
            </select>
          </div>
        </div>

        <div className="pt-6 border-t border-[var(--color-line)] text-center text-sm text-[var(--color-muted)] mb-8">
          <em>Post and Question builders will be enabled after saving the initial cycle details.</em>
        </div>

        <div className="flex justify-end gap-4">
          <Link to="/selection" className="px-6 py-2 border border-[var(--color-line)] rounded-[6px] font-medium text-[var(--color-ink)] hover:bg-gray-50">
            Cancel
          </Link>
          <button 
            type="submit" 
            disabled={updateMutation.isPending}
            className="bg-[var(--color-dusk)] text-white px-8 py-2 rounded-[6px] font-bold hover:bg-opacity-90 disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Cycle'}
          </button>
        </div>
      </form>
    </div>
  );
}
