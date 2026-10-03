import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";

export default function ApplicationForm() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState({});
  const [errorMsg, setErrorMsg] = useState("");

  // Check auth and membership status
  const { data: authData } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const res = await fetch("/api/v1/auth/me", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
  });

  const user = authData?.data;
  const isMember = user?.membership?.status === 'ACTIVE';

  // Fetch post details from selection cycles
  const { data: cyclesData, isLoading } = useQuery({
    queryKey: ['selection', 'cycles'],
    queryFn: async () => {
      const res = await fetch("/api/v1/selection/cycles");
      if (!res.ok) throw new Error("Failed to fetch selection cycles");
      return res.json();
    }
  });

  const cycles = cyclesData?.data || [];
  let post = null;
  let cycle = null;

  for (const c of cycles) {
    const found = (c.posts || []).find(p => p.id === postId);
    if (found) {
      post = found;
      cycle = c;
      break;
    }
  }

  // Fallback defaults if post is not found
  if (!post && cycles.length > 0 && cycles[0].posts?.[0]) {
    post = cycles[0].posts[0];
    cycle = cycles[0];
  }

  const submitMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch(`/api/v1/selection/posts/${postId || '00000000-0000-0000-0000-000000000020'}/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to submit application");
      }
      return json.data;
    },
    onSuccess: () => {
      alert("Application submitted successfully to the Faculty Mentor!");
      navigate("/selection");
    },
    onError: (err) => {
      setErrorMsg(err.message);
    }
  });

  const handleInputChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg("");
    if (!isMember) {
      setErrorMsg("Only verified active members can apply for leadership roles. Please join first.");
      return;
    }
    submitMutation.mutate({ answers });
  };

  if (isLoading) return <div className="p-12 text-center text-[var(--color-muted)]">Loading application form...</div>;

  const questions = post?.questions || [
    { id: '1', prompt: 'Why do you wish to serve in this executive position?', type: 'LONG_TEXT', isRequired: true },
    { id: '2', prompt: 'Detail relevant leadership, projects, or student initiative experience.', type: 'LONG_TEXT', isRequired: true }
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link to="/selection" className="text-sm font-medium text-[var(--color-dusk)] hover:underline inline-block mb-4">
          &larr; Back to Open Leadership Posts
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-display font-extrabold text-[var(--color-ink)]">
            Apply for {post?.title || "Executive Position"}
          </h1>
          <span className="bg-blue-50 text-[var(--color-dusk)] border border-blue-200 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded">
            Term: 2026–2027
          </span>
        </div>
        <p className="text-sm text-[var(--color-muted)]">
          {cycle?.name || "Executive Board Selection"} • Evaluated by Faculty Mentor & Advisory Council
        </p>
      </div>

      {/* Member Gating Guard Alert */}
      {!isMember && (
        <div className="mb-8 p-6 bg-amber-50 border-l-4 border-[var(--color-lamp)] rounded-r-xl shadow-sm">
          <div className="flex items-start gap-4">
            <span className="text-3xl">🔒</span>
            <div>
              <h3 className="text-base font-bold text-[var(--color-ink)]">
                Active Membership Required to Apply
              </h3>
              <p className="text-sm text-slate-700 mt-1 mb-4 leading-relaxed">
                By constitution, only verified students holding an active paid membership can submit applications for leadership roles. Non-members cannot apply or vote.
              </p>
              <Link
                to="/join"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--color-lamp)] text-[var(--color-ink)] font-bold text-xs shadow-sm hover:brightness-105 transition-all"
              >
                Join Membership Now &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-[var(--color-stop)] text-sm rounded-lg">
          {errorMsg}
        </div>
      )}

      <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl p-6 sm:p-10 shadow-sm">
        <div className="bg-[var(--color-paper)] p-5 rounded-lg border border-[var(--color-line)] mb-8">
          <h3 className="text-sm font-bold text-[var(--color-ink)] mb-2">Role Scope & Eligibility:</h3>
          <p className="text-xs text-[var(--color-muted)] leading-relaxed mb-3">
            {post?.description || "Lead student initiatives, coordinate with university faculty, and represent the student body."}
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-[var(--color-ink)]">
            <span>⏱️ Tenure: {post?.tenure || "1 Year"}</span>
            <span>✅ Status: Active Members Only</span>
            <span>📝 Voting: Appointed by Faculty Mentor review</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {questions.map((q, idx) => (
            <div key={q.id} className="space-y-2">
              <label className="block text-sm font-bold text-[var(--color-ink)]">
                {idx + 1}. {q.prompt} {q.isRequired && <span className="text-[var(--color-stop)]">*</span>}
              </label>
              {q.type === 'LONG_TEXT' ? (
                <div>
                  <textarea
                    required={q.isRequired}
                    disabled={!isMember}
                    rows={4}
                    value={answers[q.id] || ""}
                    onChange={e => handleInputChange(q.id, e.target.value)}
                    placeholder="Type your detailed response here..."
                    className="w-full px-3 py-2 border border-[var(--color-line)] rounded-lg text-sm focus:border-[var(--color-dusk)] focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  <div className="text-right text-[10px] text-[var(--color-muted)] mt-1 font-mono">
                    {(answers[q.id] || "").split(/\s+/).filter(Boolean).length} words
                  </div>
                </div>
              ) : (
                <input
                  type="text"
                  required={q.isRequired}
                  disabled={!isMember}
                  value={answers[q.id] || ""}
                  onChange={e => handleInputChange(q.id, e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--color-line)] rounded-lg text-sm focus:border-[var(--color-dusk)] focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              )}
            </div>
          ))}

          <div className="border-t border-[var(--color-line)] pt-6 flex justify-end gap-3">
            <Link
              to="/selection"
              className="px-5 py-2.5 border border-[var(--color-line)] rounded-lg text-sm font-semibold text-[var(--color-ink)] hover:bg-[var(--color-paper)]"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={!isMember || submitMutation.isPending}
              className="px-6 py-2.5 rounded-lg bg-[var(--color-dusk)] text-white font-bold text-sm hover:bg-opacity-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitMutation.isPending ? "Submitting..." : "Submit Application &rarr;"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
