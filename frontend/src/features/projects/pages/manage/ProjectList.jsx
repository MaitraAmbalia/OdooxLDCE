import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, CheckCircle2, ListTodo, FolderKanban as FolderKanbanIcon, Plus, X } from "lucide-react";
import { ContentState } from "@/components/common/ContentState";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

function projectProgress(project) {
  const tasks = project.tasks || [];
  if (!tasks.length) return 0;
  return Math.round((tasks.filter((task) => task.status === "DONE").length / tasks.length) * 100);
}

export default function ProjectList() {
  usePageTitle("Projects");
  const queryClient = useQueryClient();
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projectDraft, setProjectDraft] = useState({ name: "", description: "", type: "EVENT_PREP", endDate: "" });

  const createProject = useMutation({
    mutationFn: async (payload) => {
      const response = await fetch("/api/v1/projects", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error?.message || "Could not create project");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setProjectDraft({ name: "", description: "", type: "EVENT_PREP", endDate: "" });
      setShowProjectForm(false);
      toast.success("Project created successfully.");
    },
    onError: (error) => toast.error(error.message || "Could not create project."),
  });

  const submitProject = (event) => {
    event.preventDefault();
    createProject.mutate({ ...projectDraft, endDate: projectDraft.endDate ? new Date(projectDraft.endDate).toISOString() : undefined });
  };

  const { data: projectsData, isPending, isError, refetch } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await fetch("/api/v1/projects", { credentials: "include" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error?.message || "Failed to fetch projects");
      return json;
    },
  });

  const projects = projectsData?.data || [];

  return (
    <div className="page-container py-12 sm:py-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-medium text-primary">Team delivery</p>
          <h1 className="font-display text-4xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Follow active initiatives and keep work moving across every task board.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" onClick={() => setShowProjectForm((open) => !open)}>
            {showProjectForm ? <X aria-hidden="true" className="size-4 mr-1" /> : <Plus aria-hidden="true" className="size-4 mr-1" />}
            {showProjectForm ? "Cancel" : "New project"}
          </Button>
        </div>
      </div>

      {showProjectForm && (
        <form onSubmit={submitProject} className="mt-6 rounded-2xl border border-primary/20 bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div><h2 className="font-display text-xl font-semibold">Create a new project</h2><p className="mt-1 text-sm text-muted-foreground">Organize tasks and volunteers around an initiative.</p></div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div><label htmlFor="project-name" className="mb-2 block text-sm font-medium">Project name</label><Input id="project-name" required maxLength={160} value={projectDraft.name} onChange={(event) => setProjectDraft({ ...projectDraft, name: event.target.value })} placeholder="Spring Gala Production" /></div>
            <div><label htmlFor="project-end" className="mb-2 block text-sm font-medium">Target end date</label><Input id="project-end" type="date" value={projectDraft.endDate} onChange={(event) => setProjectDraft({ ...projectDraft, endDate: event.target.value })} /></div>
            <div className="md:col-span-2"><label htmlFor="project-description" className="mb-2 block text-sm font-medium">Description</label><Textarea id="project-description" value={projectDraft.description} onChange={(event) => setProjectDraft({ ...projectDraft, description: event.target.value })} placeholder="High level overview of what needs to be delivered." /></div>
          </div>
          <div className="mt-6 flex justify-end"><Button type="submit" disabled={createProject.isPending || !projectDraft.name.trim()}><Plus aria-hidden="true" className="size-4 mr-1" />{createProject.isPending ? "Creating…" : "Create project"}</Button></div>
        </form>
      )}

      {isPending ? (
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading projects"><Skeleton className="h-64 rounded-2xl" /><Skeleton className="h-64 rounded-2xl" /><Skeleton className="h-64 rounded-2xl" /></div>
      ) : isError ? (
        <div className="mt-8"><ContentState error title="Projects aren’t available right now." description="We couldn’t load the project portfolio." action={refetch} /></div>
      ) : projects.length === 0 ? (
        <div className="mt-8"><ContentState icon={FolderKanbanIcon} title="No projects yet." description="Projects will appear here once a leadership initiative has been created." /></div>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const tasks = project.tasks || [];
            const done = tasks.filter((task) => task.status === "DONE").length;
            const progress = projectProgress(project);
            const endDate = project.endDate || project.dueDate;
            return (
              <Link key={project.id} to={"/manage/projects/" + project.id} className="group flex min-h-64 flex-col rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div><p className="text-xs font-semibold uppercase tracking-wider text-primary">{project.type ? project.type.replaceAll("_", " ") : "Project"}</p><h2 className="mt-2 font-display text-xl font-semibold">{project.name}</h2></div>
                  <span className={"rounded-full px-2.5 py-1 text-xs font-semibold " + (project.status === "CLOSED" || project.status === "DONE" ? "bg-success-soft text-success" : "bg-secondary text-primary")}>{project.status === "CLOSED" ? "Closed" : project.status === "DONE" ? "Done" : "Active"}</span>
                </div>

                <p className="mt-4 line-clamp-3 flex-1 text-sm leading-6 text-muted-foreground">{project.description || "No project description has been added."}</p>

                <div className="mt-5">
                  <div className="flex items-center justify-between text-xs"><span className="flex items-center gap-1.5 text-muted-foreground"><ListTodo className="size-4" aria-hidden="true" />Task progress</span><span className="font-semibold tabular-nums">{done}/{tasks.length}</span></div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary"><div className={"h-full rounded-full " + (progress === 100 ? "bg-success" : "bg-primary")} style={{ width: progress + "%" }} /></div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">{endDate ? <><CalendarDays className="size-4" aria-hidden="true" />Ends {new Date(endDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</> : <><CheckCircle2 className="size-4" aria-hidden="true" />No end date</>}</span>
                  <span className="flex items-center gap-1 font-medium text-primary">Open board <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
