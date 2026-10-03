import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Clock3, LockKeyhole, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ContentState } from "@/components/common/ContentState";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function ApplicationForm() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState({});
  const [errorMsg, setErrorMsg] = useState("");

  // Check auth and membership status
  const { data: authData, isPending: authPending } = useQuery({
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
  const { data: cyclesData, isPending, isError, refetch } = useQuery({
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

  usePageTitle(post ? `Apply for ${post.title}` : "Leadership application");

  const submitMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch(`/api/v1/selection/posts/${postId}/applications`, {
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
      toast.success("Application submitted successfully.");
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
    if (!post) {
      setErrorMsg("This leadership position is no longer available.");
      return;
    }
    if (!isMember) {
      setErrorMsg("Only verified active members can apply for leadership roles. Please join first.");
      return;
    }
    submitMutation.mutate({ answers });
  };

  if (isPending || authPending) return <div className="page-container max-w-3xl py-12" role="status" aria-label="Loading application form"><Skeleton className="h-5 w-40" /><Skeleton className="mt-7 h-12 w-4/5" /><Skeleton className="mt-8 h-96 rounded-2xl" /></div>;
  if (isError) return <div className="page-container py-16"><ContentState error title="The application form isn’t available." description="We couldn’t load this role. Try again in a moment." action={refetch} /></div>;
  if (!post) return <div className="page-container py-16"><ContentState title="This position is no longer available." description="Return to leadership opportunities to see what is currently open." actionLabel="View opportunities" action={() => navigate("/selection")} /></div>;

  const questions = post?.questions || [
    { id: '1', prompt: 'Why do you wish to serve in this executive position?', type: 'LONG_TEXT', isRequired: true },
    { id: '2', prompt: 'Detail relevant leadership, projects, or student initiative experience.', type: 'LONG_TEXT', isRequired: true }
  ];

  return (
    <div className="page-container max-w-3xl py-12 sm:py-16">
      <div className="mb-8">
        <Link to="/selection" className="mb-5 inline-flex min-h-10 items-center gap-2 text-sm font-medium text-primary hover:underline">
          <ArrowLeft className="size-4" /> Leadership opportunities
        </Link>
        <div className="mb-2 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-4xl font-semibold tracking-tight">
            Apply for {post.title}
          </h1>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-primary">
            {cycle?.termStart && cycle?.termEnd ? `${cycle.termStart}–${cycle.termEnd}` : "Current term"}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {cycle?.name || "Executive board selection"} · Reviewed by the selection team
        </p>
      </div>

      {/* Member Gating Guard Alert */}
      {!isMember && (
        <div className="mb-8 rounded-2xl border border-[#ead2c4] bg-[#f6e8df] p-6">
          <div className="flex items-start gap-4">
            <LockKeyhole className="mt-0.5 size-6 shrink-0 text-[#86533d]" />
            <div>
              <h2 className="font-display text-lg font-semibold">
                Active membership required
              </h2>
              <p className="mb-4 mt-1 text-sm leading-6 text-muted-foreground">
                Leadership applications are available to verified active members. Explore membership before continuing.
              </p>
              <Link
                to="/join"
                className="inline-flex min-h-10 items-center rounded-md bg-[#86533d] px-4 text-sm font-medium text-white hover:bg-[#744531]"
              >
                Explore membership
              </Link>
            </div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive" role="alert">
          {errorMsg}
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-6 sm:p-10">
        <div className="mb-8 rounded-xl border border-border bg-secondary/40 p-5">
          <h2 className="mb-2 font-display text-lg font-semibold">About the role</h2>
          <p className="mb-3 text-sm leading-6 text-muted-foreground">
            {post?.description || "Lead student initiatives, coordinate with university faculty, and represent the student body."}
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5"><Clock3 className="size-3.5 text-primary" /> {post.tenure || "One-year tenure"}</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-primary" /> Active members only</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {questions.map((q, idx) => (
            <div key={q.id} className="space-y-2">
              <label htmlFor={`question-${q.id}`} className="block text-sm font-medium">
                {idx + 1}. {q.prompt} {q.isRequired && <span className="text-destructive">*</span>}
              </label>
              {q.type === 'LONG_TEXT' ? (
                <div>
                  <textarea
                    id={`question-${q.id}`}
                    required={q.isRequired}
                    disabled={!isMember}
                    rows={4}
                    value={answers[q.id] || ""}
                    onChange={e => handleInputChange(q.id, e.target.value)}
                    placeholder="Write your response…"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm leading-6 outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:bg-muted"
                  />
                  <div className="mt-1 text-right text-[10px] text-muted-foreground">
                    {(answers[q.id] || "").split(/\s+/).filter(Boolean).length} words
                  </div>
                </div>
              ) : (
                <input
                  id={`question-${q.id}`}
                  type="text"
                  required={q.isRequired}
                  disabled={!isMember}
                  value={answers[q.id] || ""}
                  onChange={e => handleInputChange(q.id, e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:bg-muted"
                />
              )}
            </div>
          ))}

          <div className="flex flex-col-reverse justify-end gap-3 border-t border-border pt-6 sm:flex-row">
            <Button asChild variant="outline"><Link to="/selection">Cancel</Link></Button>
            <Button
              type="submit"
              disabled={!isMember || submitMutation.isPending}
            >
              {submitMutation.isPending ? "Submitting…" : "Submit application"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
