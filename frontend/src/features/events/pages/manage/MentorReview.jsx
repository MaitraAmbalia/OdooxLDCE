import React, { useState } from "react";
import { GraduationCap, Zap } from "lucide-react";
import { toast } from "sonner";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";

export default function MentorReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [decision, setDecision] = useState(null); // 'APPROVE', 'REQUEST_CHANGES', 'REJECT'
  const [comment, setComment] = useState("");
  const [approvedBudget, setApprovedBudget] = useState(0);

  // Fetch current user
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
  const isMentor = user?.roles?.includes('MENTOR');

  const handleQuickMentorLogin = async () => {
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: "mentor@nirmauni.ac.in", password: "Password123!" }),
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Event Proposal details
  const { data: eventData, isLoading } = useQuery({
    queryKey: ['events', id, 'review'],
    queryFn: async () => {
      const res = await fetch(`/api/v1/events/${id}`);
      if (!res.ok) throw new Error("Failed to fetch event proposal");
      const data = await res.json();
      
      if (data?.data?.proposedBudget) {
        setApprovedBudget(data.data.proposedBudget);
      }
      return data;
    }
  });

  const reviewMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch(`/api/v1/events/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error?.message || "Failed to submit review decision");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Decision recorded");
      navigate("/manage");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to submit decision");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!decision) return;
    if ((decision === 'REQUEST_CHANGES' || decision === 'REJECT') && !comment.trim()) {
      toast.error("A comment is required for this decision.");
      return;
    }

    reviewMutation.mutate({
      decision,
      comment,
      approvedBudget: decision === 'APPROVE' ? approvedBudget : null
    });
  };

  if (isLoading) return <div className="p-12 text-center text-[var(--color-muted)]">Loading event proposal for review...</div>;
  const event = eventData?.data;

  const mockEvent = event || {
    title: "Annual Tech Gala 2026",
    proposedBy: { name: "Rohan Mehta (Event Head)" },
    status: "PENDING_APPROVAL",
    description: "The biggest flagship cultural and networking celebration of the semester.",
    venue: "University Grand Auditorium",
    startDate: "2026-10-17T10:00:00Z",
    capacity: 350,
    ticketTypes: [
      { id: '1', name: 'Member Early Bird Ticket', audience: 'MEMBER', pricePaise: 15000, quota: 200 },
      { id: '2', name: 'General Admission (Non-Member)', audience: 'NON_MEMBER', pricePaise: 30000, quota: 150 }
    ],
    budgetLines: [
      { item: "Auditorium Rental & Sound", amount: 15000 },
      { item: "Stage Décor & Lighting", amount: 8000 },
      { item: "Refreshments & High Tea", amount: 12000 }
    ]
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Mentor Authentication Warning / Quick Login */}
      {!isMentor && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-6 h-6 text-blue-600" aria-hidden="true" />
            <div>
              <h4 className="text-sm font-bold text-amber-900">Faculty Mentor Authorization</h4>
              <p className="text-xs text-amber-700">
                {user 
                  ? `Currently logged in as ${user.name} (${user.roles?.[0] || 'Member'}). Proposal review requires Mentor role.` 
                  : 'You are currently not logged in. Log in as Mentor to authorize this event proposal.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleQuickMentorLogin}
            className="px-4 py-2 bg-[var(--color-dusk)] text-white text-xs font-bold rounded-lg hover:bg-opacity-90 transition-all shadow-sm whitespace-nowrap self-start sm:self-center"
          >
            <Zap className="w-4 h-4 inline-block shrink-0 -mt-0.5 mr-1" aria-hidden="true" />Quick Log In as Mentor
          </button>
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link to="/manage" className="text-sm font-semibold text-[var(--color-dusk)] hover:underline inline-block mb-1">
            &larr; Back to Manage Hub
          </Link>
          <h1 className="text-3xl font-display font-extrabold text-[var(--color-ink)]">Event Authorization Review</h1>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
          Pending Mentor Authorization
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Proposal Overview & Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-display font-bold text-[var(--color-ink)] mb-4">{mockEvent.title}</h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 p-4 bg-[var(--color-paper)] rounded-lg text-xs">
              <div>
                <span className="text-[var(--color-muted)] block mb-0.5">Proposed By</span>
                <span className="font-bold text-[var(--color-ink)]">{mockEvent.proposedBy?.name || "Event Head"}</span>
              </div>
              <div>
                <span className="text-[var(--color-muted)] block mb-0.5">Venue</span>
                <span className="font-bold text-[var(--color-ink)]">{mockEvent.venue}</span>
              </div>
              <div>
                <span className="text-[var(--color-muted)] block mb-0.5">Start Date</span>
                <span className="font-bold text-[var(--color-ink)]">{new Date(mockEvent.startDate || mockEvent.startAt || Date.now()).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-[var(--color-muted)] block mb-0.5">Total Capacity</span>
                <span className="font-bold text-[var(--color-ink)]">{mockEvent.capacity} Attendees</span>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-2">Description</h3>
              <p className="text-sm text-[var(--color-ink)] leading-relaxed">{mockEvent.description}</p>
            </div>

            {/* Ticket Tiers */}
            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-3">Proposed Ticket Tiers</h3>
              <div className="space-y-2">
                {(mockEvent.ticketTypes || []).map((t, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] text-xs font-medium">
                    <div>
                      <span className="font-bold text-[var(--color-ink)]">{t.name}</span>
                      <span className="ml-2 text-[11px] uppercase font-bold text-[var(--color-dusk)] bg-blue-50 px-2 py-0.5 rounded">
                        {t.audience}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span>Quota: <strong>{t.quota}</strong></span>
                      <span className="font-mono font-bold text-[var(--color-ink)]">₹{((t.pricePaise || 0) / 100).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Budget Breakdown */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-3">Estimated Budget Breakdown</h3>
              <div className="divide-y divide-[var(--color-line)] border border-[var(--color-line)] rounded-lg overflow-hidden text-xs">
                {(mockEvent.budgetLines || [
                  { item: "Venue & Audio Stage Setup", amount: 15000 },
                  { item: "Lighting & Badges", amount: 8000 },
                  { item: "Guest Hospitality & High Tea", amount: 12000 }
                ]).map((line, idx) => (
                  <div key={idx} className="flex justify-between p-3 bg-white">
                    <span className="text-[var(--color-ink)]">{line.item}</span>
                    <span className="font-mono font-bold text-[var(--color-ink)]">₹{line.amount.toLocaleString('en-IN')}</span>
                  </div>
                ))}
                <div className="flex justify-between p-3 bg-[var(--color-paper)] font-bold text-sm">
                  <span>Total Proposed Budget</span>
                  <span className="font-mono text-[var(--color-dusk)]">₹35,000.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Sticky Decision Console */}
        <div className="space-y-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl p-6 shadow-sm sticky top-20">
            <h3 className="text-lg font-display font-bold text-[var(--color-ink)] mb-4">Mentor Decision</h3>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                  Authorization Action
                </label>
                <div className="grid grid-cols-1 gap-2">
                  <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                    decision === 'APPROVE' ? 'border-[var(--color-ok)] bg-emerald-50 text-emerald-900 font-bold' : 'border-[var(--color-line)] hover:bg-gray-50'
                  }`}>
                    <input
                      type="radio"
                      name="decision"
                      value="APPROVE"
                      checked={decision === 'APPROVE'}
                      onChange={() => setDecision('APPROVE')}
                      className="accent-[var(--color-ok)]"
                    />
                    <div>
                      <span className="text-sm block">Approve Proposal</span>
                      <span className="text-[11px] text-[var(--color-muted)] font-normal">Authorizes tickets and locks budget</span>
                    </div>
                  </label>

                  <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                    decision === 'REQUEST_CHANGES' ? 'border-amber-400 bg-amber-50 text-amber-900 font-bold' : 'border-[var(--color-line)] hover:bg-gray-50'
                  }`}>
                    <input
                      type="radio"
                      name="decision"
                      value="REQUEST_CHANGES"
                      checked={decision === 'REQUEST_CHANGES'}
                      onChange={() => setDecision('REQUEST_CHANGES')}
                      className="accent-amber-500"
                    />
                    <div>
                      <span className="text-sm block">Request Changes</span>
                      <span className="text-[11px] text-[var(--color-muted)] font-normal">Sends proposal back with comments</span>
                    </div>
                  </label>

                  <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                    decision === 'REJECT' ? 'border-[var(--color-stop)] bg-red-50 text-red-900 font-bold' : 'border-[var(--color-line)] hover:bg-gray-50'
                  }`}>
                    <input
                      type="radio"
                      name="decision"
                      value="REJECT"
                      checked={decision === 'REJECT'}
                      onChange={() => setDecision('REJECT')}
                      className="accent-[var(--color-stop)]"
                    />
                    <div>
                      <span className="text-sm block">Reject Proposal</span>
                      <span className="text-[11px] text-[var(--color-muted)] font-normal">Declines event completely</span>
                    </div>
                  </label>
                </div>
              </div>

              {decision === 'APPROVE' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-1">
                    Allocated Budget (₹)
                  </label>
                  <input
                    type="number"
                    value={approvedBudget || 35000}
                    onChange={(e) => setApprovedBudget(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[var(--color-line)] rounded-lg text-sm font-mono font-bold focus:border-[var(--color-dusk)] focus:outline-none"
                  />
                  <p className="text-[11px] text-[var(--color-muted)] mt-1">Pre-filled with proposal total. Adjust if needed.</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-1">
                  Mentor Feedback / Comments {decision !== 'APPROVE' && decision && <span className="text-[var(--color-stop)]">*</span>}
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={decision === 'APPROVE' ? "Optional congratulations or venue remarks..." : "Specify required changes before re-submission..."}
                  className="w-full px-3 py-2 border border-[var(--color-line)] rounded-lg text-xs focus:border-[var(--color-dusk)] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={!decision || !isMentor || reviewMutation.isPending}
                className="w-full py-2.5 px-4 rounded-lg bg-[var(--color-dusk)] text-white text-sm font-bold hover:bg-opacity-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
              >
                {!isMentor ? "Log in as Mentor to Submit" : reviewMutation.isPending ? "Recording Decision..." : "Submit Authorization &rarr;"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
