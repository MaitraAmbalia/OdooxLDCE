import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";

export default function AnnouncementComposer() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: "",
    body: "",
    audience: "EVERYONE", // EVERYONE, MEMBERS, VOLUNTEERS
    sendEmail: false
  });
  const [showPreview, setShowPreview] = useState(false);

  const composeMutation = useMutation({
    mutationFn: async (data) => {
      // API endpoint: POST /announcements
      console.log("Publishing announcement:", data);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      navigate("/announcements");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.body) return;
    composeMutation.mutate(formData);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <Link to="/manage/announcements" className="text-sm font-medium text-[var(--color-dusk)] hover:underline inline-block mb-2">
            &larr; Back to Manage
          </Link>
          <h1 className="text-3xl font-display font-extrabold text-[var(--color-ink)]">New Announcement</h1>
        </div>
        <div className="flex gap-2">
          <button 
            type="button" 
            onClick={() => setShowPreview(!showPreview)}
            className="px-4 py-2 border border-[var(--color-line)] bg-white text-[var(--color-ink)] rounded-[6px] text-sm font-medium hover:bg-gray-50"
          >
            {showPreview ? 'Edit Mode' : 'Preview'}
          </button>
          <button 
            onClick={handleSubmit}
            disabled={!formData.title || !formData.body || composeMutation.isPending}
            className="bg-[var(--color-dusk)] text-white px-6 py-2 rounded-[6px] text-sm font-medium hover:bg-opacity-90 disabled:opacity-50"
          >
            Publish Now
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Editor/Preview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[10px] p-6 shadow-sm min-h-[500px]">
            {showPreview ? (
              <div>
                <h2 className="text-2xl font-display font-bold text-[var(--color-ink)] mb-6">{formData.title || "Untitled Announcement"}</h2>
                <article className="prose prose-sm sm:prose-base prose-ink max-w-none">
                  <ReactMarkdown>{formData.body || "*No content yet...*"}</ReactMarkdown>
                </article>
              </div>
            ) : (
              <div className="space-y-4 h-full flex flex-col">
                <input 
                  type="text" 
                  placeholder="Announcement Title"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full text-2xl font-display font-bold text-[var(--color-ink)] border-b border-[var(--color-line)] pb-4 focus:outline-none focus:border-[var(--color-dusk)] bg-transparent placeholder-gray-300"
                />
                <textarea 
                  placeholder="Write your announcement in Markdown..."
                  value={formData.body}
                  onChange={e => setFormData({...formData, body: e.target.value})}
                  className="w-full flex-1 resize-none bg-transparent focus:outline-none text-base text-[var(--color-ink)] leading-relaxed placeholder-gray-300"
                />
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[10px] p-6 shadow-sm">
            <h3 className="font-semibold text-[var(--color-ink)] mb-4">Audience</h3>
            
            <div className="space-y-3 mb-6">
              {[
                { id: 'EVERYONE', label: 'Everyone (Public)' },
                { id: 'MEMBERS', label: 'Active Members Only' },
                { id: 'VOLUNTEERS', label: 'Volunteers Only' }
              ].map(aud => (
                <label key={aud.id} className={`flex items-center gap-3 p-3 border rounded-[6px] cursor-pointer transition-colors ${formData.audience === aud.id ? 'border-[var(--color-dusk)] bg-[var(--color-paper)]' : 'border-[var(--color-line)] hover:bg-gray-50'}`}>
                  <input 
                    type="radio" 
                    name="audience" 
                    value={aud.id}
                    checked={formData.audience === aud.id}
                    onChange={e => setFormData({...formData, audience: e.target.value})}
                    className="accent-[var(--color-dusk)]"
                  />
                  <span className="text-sm font-medium text-[var(--color-ink)]">{aud.label}</span>
                </label>
              ))}
            </div>

            <div className="bg-[var(--color-paper)] p-4 rounded-[6px] border border-[var(--color-line)] mb-6 text-sm flex justify-between items-center">
              <span className="text-[var(--color-muted)]">Estimated recipients:</span>
              <span className="font-mono font-bold text-[var(--color-ink)]">
                {formData.audience === 'EVERYONE' ? 'Public' : formData.audience === 'MEMBERS' ? '845' : '120'}
              </span>
            </div>

            <h3 className="font-semibold text-[var(--color-ink)] mb-4">Channels</h3>
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={true}
                disabled
                className="w-4 h-4 accent-[var(--color-dusk)]"
              />
              <span className="text-sm text-[var(--color-ink)]">Post to Website (Feed)</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer mt-3">
              <input 
                type="checkbox" 
                checked={formData.sendEmail}
                onChange={e => setFormData({...formData, sendEmail: e.target.checked})}
                className="w-4 h-4 accent-[var(--color-dusk)]"
              />
              <span className="text-sm text-[var(--color-ink)]">Blast via Email (Newsletter)</span>
            </label>
          </div>
        </div>

      </div>
    </div>
  );
}
