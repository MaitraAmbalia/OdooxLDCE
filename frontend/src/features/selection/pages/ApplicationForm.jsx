import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";

export default function ApplicationForm() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState({});

  const { data: postData, isLoading } = useQuery({
    queryKey: ['selection', 'posts', postId],
    queryFn: async () => {
      // API endpoint: GET /selection/posts/:postId
      const res = await fetch(`/api/v1/selection/posts/${postId}`);
      if (!res.ok) throw new Error("Failed to fetch post details");
      return res.json();
    }
  });

  const submitMutation = useMutation({
    mutationFn: async (payload) => {
      // API endpoint: POST /selection/posts/:postId/applications
      console.log("Submitting application:", payload);
      return { success: true };
    },
    onSuccess: () => {
      alert("Application submitted successfully!");
      navigate("/selection");
    }
  });

  if (isLoading) return <div className="p-12 text-center text-[var(--color-muted)]">Loading application form...</div>;
  if (!postData?.data) return <div className="p-12 text-center text-[var(--color-stop)]">Position not found.</div>;

  const post = postData.data;
  const questions = post.questions || [];

  const handleInputChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submitMutation.mutate({ answers });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link to="/selection" className="text-sm font-medium text-[var(--color-dusk)] hover:underline inline-block mb-4">
          &larr; Back to Open Positions
        </Link>
        <h1 className="text-3xl font-display font-extrabold text-[var(--color-ink)] mb-2">Apply for {post.title}</h1>
        <p className="text-sm text-[var(--color-muted)]">
          {post.cycle?.name} &bull; Term: {post.cycle?.termStart} to {post.cycle?.termEnd}
        </p>
      </div>

      <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[10px] p-6 sm:p-10 shadow-sm">
        <div className="bg-[var(--color-paper)] p-4 rounded-[6px] border border-[var(--color-line)] mb-8">
          <h3 className="font-bold text-[var(--color-ink)] mb-2">Role Description</h3>
          <p className="text-sm text-[var(--color-ink)]">{post.description}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {questions.map((q, i) => (
            <div key={q.id}>
              <label className="block text-sm font-bold text-[var(--color-ink)] mb-2">
                {i + 1}. {q.text} {q.required && <span className="text-[var(--color-stop)]">*</span>}
              </label>

              {q.type === 'TEXTAREA' ? (
                <textarea
                  required={q.required}
                  rows="4"
                  value={answers[q.id] || ''}
                  onChange={(e) => handleInputChange(q.id, e.target.value)}
                  className="w-full px-4 py-3 border border-[var(--color-line)] rounded-[6px] text-sm focus:border-[var(--color-dusk)] focus:outline-none"
                  placeholder="Your answer..."
                />
              ) : q.type === 'SELECT' ? (
                <select
                  required={q.required}
                  value={answers[q.id] || ''}
                  onChange={(e) => handleInputChange(q.id, e.target.value)}
                  className="w-full px-4 py-3 border border-[var(--color-line)] rounded-[6px] text-sm focus:border-[var(--color-dusk)] focus:outline-none bg-white"
                >
                  <option value="" disabled>Select an option...</option>
                  {q.options?.map((opt, idx) => (
                    <option key={idx} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  required={q.required}
                  value={answers[q.id] || ''}
                  onChange={(e) => handleInputChange(q.id, e.target.value)}
                  className="w-full px-4 py-3 border border-[var(--color-line)] rounded-[6px] text-sm focus:border-[var(--color-dusk)] focus:outline-none"
                  placeholder="Your answer..."
                />
              )}
            </div>
          ))}

          {questions.length === 0 && (
            <p className="text-sm text-[var(--color-muted)] italic mb-8">No specific questions required for this post. Just click submit.</p>
          )}

          <div className="pt-6 border-t border-[var(--color-line)]">
            <button
              type="submit"
              disabled={submitMutation.isPending}
              className="w-full bg-[var(--color-dusk)] text-white py-4 rounded-[6px] font-bold text-lg hover:bg-opacity-90 disabled:opacity-50 transition-opacity"
            >
              {submitMutation.isPending ? 'Submitting...' : 'Submit Application'}
            </button>
            <p className="text-xs text-center text-[var(--color-muted)] mt-4">
              By submitting, you agree to the time commitments outlined in the role description.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
