import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";

export default function MentorReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [decision, setDecision] = useState(null); // 'APPROVE', 'REQUEST_CHANGES', 'REJECT'
  const [comment, setComment] = useState("");
  const [approvedBudget, setApprovedBudget] = useState(0);

  // Fetch Event Proposal details
  const { data: eventData, isLoading } = useQuery({
    queryKey: ['events', id, 'review'],
    queryFn: async () => {
      // API endpoint: GET /events/:id
      const res = await fetch(`/api/v1/events/${id}`);
      if (!res.ok) throw new Error("Failed to fetch event proposal");
      const data = await res.json();
      
      // Initialize budget for approval
      if (data?.data?.proposedBudget) {
        setApprovedBudget(data.data.proposedBudget);
      }
      return data;
    }
  });

  const reviewMutation = useMutation({
    mutationFn: async (payload) => {
      // API endpoint: POST /events/:id/review
      console.log("Submitting review decision:", payload);
      return { success: true };
    },
    onSuccess: () => {
      navigate("/manage/approvals/events");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!decision) return;
    if ((decision === 'REQUEST_CHANGES' || decision === 'REJECT') && !comment.trim()) {
      alert("A comment is required for this decision.");
      return;
    }

    reviewMutation.mutate({
      decision,
      comment,
      approvedBudget: decision === 'APPROVE' ? approvedBudget : null
    });
  };

  if (isLoading) return <div className="p-8 text-center">Loading proposal...</div>;
  const event = eventData?.data;

  // Mock data if API is not fully wired yet
  const mockEvent = event || {
    title: "Annual Tech Gala 2026",
    proposer: "Aarav Shah",
    status: "PENDING_APPROVAL",
    description: "A large networking and showcase event...",
    venue: "Main Auditorium",
    capacity: 500,
    proposedBudget: 2500000 // 25,000.00 INR (paise)
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <Link to="/manage/approvals/events" className="text-sm font-medium text-[var(--color-dusk)] hover:underline mb-6 inline-block">
        &larr; Back to Queue
      </Link>
      
      <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-start">
        {/* Left: Scrollable Proposal View */}
        <div className="lg:col-span-8 bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[10px] p-6 shadow-sm overflow-y-auto" style={{ maxHeight: "calc(100vh - 150px)" }}>
          <div className="border-b border-[var(--color-line)] pb-4 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-display font-extrabold text-[var(--color-ink)]">{mockEvent.title}</h1>
                <p className="text-sm text-[var(--color-muted)] mt-1">Proposed by: {mockEvent.proposer}</p>
              </div>
              <span className="bg-[var(--color-wait)] text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                {mockEvent.status.replace('_', ' ')}
              </span>
            </div>
          </div>
          
          <div className="space-y-8 text-sm">
            <section>
              <h3 className="font-semibold text-[var(--color-ink)] uppercase tracking-wide mb-2 text-xs">Event Details</h3>
              <div className="bg-[var(--color-paper)] p-4 rounded-[6px]">
                <p className="whitespace-pre-wrap">{mockEvent.description}</p>
              </div>
            </section>
            
            <section className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-[var(--color-ink)] uppercase tracking-wide mb-2 text-xs">Logistics</h3>
                <ul className="space-y-2 text-[var(--color-muted)]">
                  <li><span className="font-medium text-[var(--color-ink)]">Venue:</span> {mockEvent.venue}</li>
                  <li><span className="font-medium text-[var(--color-ink)]">Capacity:</span> {mockEvent.capacity}</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-[var(--color-ink)] uppercase tracking-wide mb-2 text-xs">Proposed Budget</h3>
                <div className="text-2xl font-display font-bold tabular-nums text-[var(--color-ink)]">
                  {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((mockEvent.proposedBudget || 0) / 100)}
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Right: Sticky Decision Panel */}
        <div className="lg:col-span-4 mt-8 lg:mt-0 sticky top-8">
          <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[10px] p-6 shadow-md">
            <h2 className="text-lg font-display font-bold text-[var(--color-ink)] mb-4">Your Decision</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <label className={`block p-3 rounded-[6px] border cursor-pointer ${decision === 'APPROVE' ? 'border-[var(--color-ok)] bg-green-50' : 'border-[var(--color-line)] hover:bg-[var(--color-paper)]'}`}>
                  <input type="radio" name="decision" value="APPROVE" className="mr-3" onChange={(e) => setDecision(e.target.value)} />
                  <span className="font-medium">Approve</span>
                </label>
                
                <label className={`block p-3 rounded-[6px] border cursor-pointer ${decision === 'REQUEST_CHANGES' ? 'border-[var(--color-wait)] bg-yellow-50' : 'border-[var(--color-line)] hover:bg-[var(--color-paper)]'}`}>
                  <input type="radio" name="decision" value="REQUEST_CHANGES" className="mr-3" onChange={(e) => setDecision(e.target.value)} />
                  <span className="font-medium">Request Changes</span>
                </label>

                <label className={`block p-3 rounded-[6px] border cursor-pointer ${decision === 'REJECT' ? 'border-[var(--color-stop)] bg-red-50' : 'border-[var(--color-line)] hover:bg-[var(--color-paper)]'}`}>
                  <input type="radio" name="decision" value="REJECT" className="mr-3" onChange={(e) => setDecision(e.target.value)} />
                  <span className="font-medium">Reject</span>
                </label>
              </div>

              {decision === 'APPROVE' && (
                <div className="animate-in fade-in duration-200">
                  <label className="block text-sm font-medium text-[var(--color-ink)] mb-1">Approved Budget (₹)</label>
                  <input 
                    type="number" 
                    value={approvedBudget / 100}
                    onChange={(e) => setApprovedBudget(Math.round(e.target.value * 100))}
                    className="w-full px-3 py-2 border border-[var(--color-line)] rounded-[6px] font-mono tabular-nums"
                  />
                  <p className="text-xs text-[var(--color-muted)] mt-1">Prefilled with requested amount.</p>
                </div>
              )}

              {(decision === 'REQUEST_CHANGES' || decision === 'REJECT') && (
                <div className="animate-in fade-in duration-200">
                  <label className="block text-sm font-medium text-[var(--color-ink)] mb-1">
                    Feedback / Reason <span className="text-[var(--color-stop)]">*</span>
                  </label>
                  <textarea 
                    rows={4} 
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    required
                    placeholder="Explain what needs to change..."
                    className="w-full px-3 py-2 border border-[var(--color-line)] rounded-[6px] text-sm"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={!decision || reviewMutation.isPending}
                className="w-full py-3 px-4 rounded-[6px] text-sm font-medium text-white shadow-sm disabled:opacity-50 transition-colors bg-[var(--color-dusk)] hover:bg-opacity-90"
              >
                Submit Decision
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
