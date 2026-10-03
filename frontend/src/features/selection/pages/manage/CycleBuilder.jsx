import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Info } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ContentState } from "@/components/common/ContentState";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function CycleBuilder() {
  usePageTitle("Selection cycle");
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

  const { data: cyclesData, isPending, isError, refetch } = useQuery({
    queryKey: ['selection', 'cycles'],
    queryFn: async () => {
      const res = await fetch("/api/v1/selection/cycles");
      if (!res.ok) throw new Error("Failed to fetch selection cycles");
      return res.json();
    },
    enabled: id !== 'new'
  });
  const cycleData = cyclesData?.data?.find((cycle) => cycle.id === id);

  useEffect(() => {
    if (cycleData) {
      const cycle = cycleData;
      setFormData({
        name: cycle.name || cycle.title || "",
        termStart: cycle.termStart ? String(cycle.termStart).slice(0, 7) : "",
        termEnd: cycle.termEnd ? String(cycle.termEnd).slice(0, 7) : "",
        deadlineAt: cycle.deadlineAt || cycle.applicationsCloseAt ? new Date(cycle.deadlineAt || cycle.applicationsCloseAt).toISOString().slice(0,16) : "",
        status: cycle.status || "DRAFT"
      });
    }
  }, [cycleData]);

  const updateMutation = useMutation({
    mutationFn: async (payload) => {
      const url = id === 'new' ? "/api/v1/selection/cycles" : `/api/v1/selection/cycles/${id}`;
      const method = id === 'new' ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || "Failed to save selection cycle");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['selection', 'cycles']);
      toast.success("Selection cycle saved successfully!");
      if (id === 'new' && data?.data?.id) {
        navigate(`/manage/selection/${data.data.id}/edit`);
      }
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isPending && id !== 'new') return <div className="page-container max-w-4xl py-12" role="status" aria-label="Loading cycle editor"><Skeleton className="h-10 w-64" /><Skeleton className="mt-8 h-96 rounded-2xl" /></div>;
  if (isError) return <div className="page-container py-16"><ContentState error title="The cycle editor isn’t available." description="We couldn’t load the selection cycle." action={refetch} /></div>;
  if (id !== "new" && !cycleData) return <div className="page-container py-16"><ContentState title="Selection cycle not found." description="Return to the selection workspace and choose an available cycle." actionLabel="Back to selection" action={() => navigate("/selection")} /></div>;

  return (
    <div className="page-container max-w-4xl py-12 sm:py-16">
      <div className="mb-8">
        <Link to="/selection" className="mb-4 inline-flex min-h-10 items-center gap-2 text-sm font-medium text-primary hover:underline">
          <ArrowLeft className="size-4" /> Selection workspace
        </Link>
        <h1 className="font-display text-4xl font-semibold tracking-tight">
          {id === 'new' ? 'Create selection cycle' : 'Edit selection cycle'}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Set the term and application window before adding positions.</p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 sm:p-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="md:col-span-2">
            <label htmlFor="cycle-name" className="mb-1.5 block text-sm font-medium">Cycle name</label>
            <Input
              id="cycle-name"
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="e.g., Executive Board 2026-2027"
            />
          </div>
          <div>
            <label htmlFor="term-start" className="mb-1.5 block text-sm font-medium">Term start</label>
            <Input
              id="term-start"
              type="month"
              required
              value={formData.termStart}
              onChange={e => setFormData({...formData, termStart: e.target.value})}
            />
          </div>
          <div>
            <label htmlFor="term-end" className="mb-1.5 block text-sm font-medium">Term end</label>
            <Input
              id="term-end"
              type="month"
              required
              value={formData.termEnd}
              onChange={e => setFormData({...formData, termEnd: e.target.value})}
            />
          </div>
          <div>
            <label htmlFor="application-deadline" className="mb-1.5 block text-sm font-medium">Application deadline</label>
            <Input
              id="application-deadline"
              type="datetime-local"
              required
              value={formData.deadlineAt}
              onChange={e => setFormData({...formData, deadlineAt: e.target.value})}
            />
          </div>
          <div>
            <label htmlFor="cycle-status" className="mb-1.5 block text-sm font-medium">Status</label>
            <select
              id="cycle-status"
              value={formData.status}
              onChange={e => setFormData({...formData, status: e.target.value})}
              className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="DRAFT">Draft</option>
              <option value="OPEN">Published (Open)</option>
              <option value="CLOSED">Closed (Reviewing)</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-border">
          <Button asChild variant="outline"><Link to="/selection">Cancel</Link></Button>
          <Button
            type="submit"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Saving…' : 'Save cycle'}
          </Button>
        </div>
      </form>

      {id !== 'new' && (
        <div className="mt-8 rounded-2xl border border-border bg-card p-6 sm:p-10">
          <h2 className="font-display text-2xl font-semibold mb-6">Positions</h2>
          <div className="space-y-4 mb-8">
            {cycleData?.posts?.map(post => (
              <div key={post.id} className="flex justify-between items-center rounded-xl border border-border bg-secondary/30 p-4">
                <div>
                  <h3 className="font-semibold text-lg">{post.title}</h3>
                  <p className="text-sm text-muted-foreground">{post.description}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium">{post.capacity} Seats</span>
                  <Button variant="ghost" className="text-destructive block ml-auto mt-2 h-auto py-1 px-2 text-xs hover:bg-destructive/10" onClick={async () => {
                     await fetch(`/api/v1/selection/posts/${post.id}`, { method: 'DELETE', credentials: 'include' });
                     refetch();
                  }}>Delete</Button>
                </div>
              </div>
            ))}
            {!cycleData?.posts?.length && <p className="text-sm text-muted-foreground">No positions added yet.</p>}
          </div>

          <h3 className="font-semibold text-lg mb-4">Add new position</h3>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const data = new FormData(e.target);
            await fetch(`/api/v1/selection/cycles/${id}/posts`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                role: data.get('role'),
                seats: data.get('seats'),
                description: data.get('description'),
              })
            });
            e.target.reset();
            refetch();
          }} className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <select name="role" required className="h-10 rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option value="">Select a role...</option>
                <option value="PRESIDENT">President</option>
                <option value="TREASURER">Treasurer</option>
                <option value="MARKETING_HEAD">Marketing Head</option>
                <option value="EVENT_HEAD">Event Head</option>
                <option value="VOLUNTEER_HEAD">Volunteer Head</option>
                <option value="SPONSORSHIP_HEAD">Sponsorship Head</option>
              </select>
              <Input name="seats" type="number" min="1" defaultValue="1" placeholder="Number of seats" required />
            </div>
            <textarea name="description" required rows="2" placeholder="Job description" className="w-full rounded-md border border-input bg-card p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"></textarea>
            <Button type="submit" className="w-fit bg-primary text-primary-foreground hover:bg-primary/90">Add position</Button>
          </form>
        </div>
      )}
    </div>
  );
}
