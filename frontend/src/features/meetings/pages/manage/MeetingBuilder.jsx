import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function MeetingBuilder() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: "",
    scheduledAt: "",
    location: "",
    audienceType: "LEADERS", // LEADERS, VOLUNTEERS, BOTH, CUSTOM
    isRequired: true,
  });

  const [agenda, setAgenda] = useState([]);
  const [newItem, setNewItem] = useState({ topic: "", owner: "", minutes: 15 });

  const totalMinutes = agenda.reduce((acc, item) => acc + parseInt(item.minutes || 0), 0);

  const addAgendaItem = () => {
    if (!newItem.topic) return;
    setAgenda([...agenda, { ...newItem, id: Date.now().toString() }]);
    setNewItem({ topic: "", owner: "", minutes: 15 });
  };

  const removeAgendaItem = (id) => {
    setAgenda(agenda.filter(a => a.id !== id));
  };

  const createMeetingMutation = useMutation({
    mutationFn: async (payload) => {
      // API endpoint: POST /meetings
      console.log("Creating meeting:", payload);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      navigate("/manage/meetings");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMeetingMutation.mutate({ ...formData, agenda });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link to="/manage/meetings" className="text-sm font-medium text-[var(--color-dusk)] hover:underline inline-block mb-2">
          &larr; Back to Meetings
        </Link>
        <h1 className="text-3xl font-display font-extrabold text-[var(--color-ink)]">Schedule Meeting</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basics */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[10px] p-6 shadow-sm">
          <h2 className="text-lg font-display font-bold text-[var(--color-ink)] mb-4">Meeting Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[var(--color-ink)] mb-1">Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                placeholder="e.g., Gala Logistics Sync"
                className="w-full px-3 py-2 border border-[var(--color-line)] rounded-[6px] text-sm focus:border-[var(--color-dusk)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-ink)] mb-1">Date & Time</label>
              <input
                type="datetime-local"
                required
                value={formData.scheduledAt}
                onChange={e => setFormData({...formData, scheduledAt: e.target.value})}
                className="w-full px-3 py-2 border border-[var(--color-line)] rounded-[6px] text-sm focus:border-[var(--color-dusk)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-ink)] mb-1">Location / Link</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
                placeholder="Room 4B or Zoom Link"
                className="w-full px-3 py-2 border border-[var(--color-line)] rounded-[6px] text-sm focus:border-[var(--color-dusk)] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Audience */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[10px] p-6 shadow-sm">
          <h2 className="text-lg font-display font-bold text-[var(--color-ink)] mb-4">Audience & Attendance</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[var(--color-ink)] mb-2">Who should attend?</label>
              <select
                value={formData.audienceType}
                onChange={e => setFormData({...formData, audienceType: e.target.value})}
                className="w-full px-3 py-2 border border-[var(--color-line)] rounded-[6px] text-sm focus:border-[var(--color-dusk)] focus:outline-none bg-white"
              >
                <option value="LEADERS">All Leaders</option>
                <option value="VOLUNTEERS">All Volunteers</option>
                <option value="BOTH">Leaders & Volunteers</option>
                <option value="CUSTOM">Custom Selection...</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-ink)] mb-2">Attendance Policy</label>
              <label className="flex items-center gap-3 p-2 border border-[var(--color-line)] rounded-[6px] cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.isRequired}
                  onChange={e => setFormData({...formData, isRequired: e.target.checked})}
                  className="w-4 h-4 accent-[var(--color-dusk)]"
                />
                <span className="text-sm font-medium text-[var(--color-ink)]">Mandatory Attendance</span>
              </label>
            </div>
          </div>
        </div>

        {/* Agenda Builder */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[10px] p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-display font-bold text-[var(--color-ink)]">Agenda Builder</h2>
            <div className="bg-[var(--color-paper)] border border-[var(--color-line)] px-3 py-1 rounded-[6px] text-sm flex gap-2 items-center">
              <span className="text-[var(--color-muted)]">Total Time:</span>
              <span className={`font-mono font-bold ${totalMinutes > 120 ? 'text-[var(--color-stop)]' : 'text-[var(--color-ink)]'}`}>
                {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
              </span>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            {agenda.map((item, index) => (
              <div key={item.id} className="flex gap-4 items-center bg-[var(--color-paper)] p-3 rounded-[6px] border border-[var(--color-line)]">
                <div className="text-[var(--color-muted)] font-mono text-xs">{index + 1}</div>
                <div className="flex-1 text-sm font-medium text-[var(--color-ink)]">{item.topic}</div>
                <div className="w-32 text-xs text-[var(--color-muted)] truncate">{item.owner}</div>
                <div className="w-16 text-right font-mono text-sm">{item.minutes}m</div>
                <button type="button" onClick={() => removeAgendaItem(item.id)} className="text-[var(--color-stop)] hover:text-red-700 p-1">
                  &times;
                </button>
              </div>
            ))}
            {agenda.length === 0 && (
              <p className="text-sm text-[var(--color-muted)] text-center py-4">No agenda items added yet.</p>
            )}
          </div>

          <div className="flex gap-3 items-start border-t border-[var(--color-line)] pt-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Topic..."
                value={newItem.topic}
                onChange={e => setNewItem({...newItem, topic: e.target.value})}
                className="w-full px-3 py-2 border border-[var(--color-line)] rounded-[6px] text-sm focus:border-[var(--color-dusk)] focus:outline-none"
              />
            </div>
            <div className="w-40">
              <input
                type="text"
                placeholder="Owner (optional)"
                value={newItem.owner}
                onChange={e => setNewItem({...newItem, owner: e.target.value})}
                className="w-full px-3 py-2 border border-[var(--color-line)] rounded-[6px] text-sm focus:border-[var(--color-dusk)] focus:outline-none"
              />
            </div>
            <div className="w-24">
              <input
                type="number"
                min="1"
                placeholder="Mins"
                value={newItem.minutes}
                onChange={e => setNewItem({...newItem, minutes: e.target.value})}
                className="w-full px-3 py-2 border border-[var(--color-line)] rounded-[6px] text-sm focus:border-[var(--color-dusk)] focus:outline-none font-mono"
              />
            </div>
            <button
              type="button"
              onClick={addAgendaItem}
              disabled={!newItem.topic}
              className="bg-white border border-[var(--color-dusk)] text-[var(--color-dusk)] px-4 py-2 rounded-[6px] text-sm font-medium hover:bg-blue-50 disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={createMeetingMutation.isPending}
            className="bg-[var(--color-dusk)] text-white px-8 py-3 rounded-[6px] font-bold hover:bg-opacity-90 disabled:opacity-50"
          >
            {createMeetingMutation.isPending ? 'Scheduling...' : 'Schedule Meeting & Send Invites'}
          </button>
        </div>
      </form>
    </div>
  );
}
