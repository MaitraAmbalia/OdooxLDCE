import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, CheckCircle2, ListTodo } from "lucide-react";
import { ContentState } from "@/components/common/ContentState";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";

function projectProgress(project) {
  const tasks = project.tasks || [];
  if (!tasks.length) return 0;
  return Math.round((tasks.filter((task) => task.status === "DONE").length / tasks.length) * 100);
}

export default function ProjectList() {
  usePageTitle("Projects");
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
      <div>
        <p className="mb-2 text-sm font-medium text-primary">Team delivery</p>
        <h1 className="font-display text-4xl font-semibold tracking-tight">Projects</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Follow active initiatives and keep work moving across every task board.</p>
      </div>

      {isPending ? (
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading projects"><Skeleton className="h-64 rounded-2xl" /><Skeleton className="h-64 rounded-2xl" /><Skeleton className="h-64 rounded-2xl" /></div>
      ) : isError ? (
        <div className="mt-8"><ContentState error title="Projects aren’t available right now." description="We couldn’t load the project portfolio." action={refetch} /></div>
      ) : projects.length === 0 ? (
        <div className="mt-8"><ContentState title="No projects yet." description="Projects will appear here once a leadership initiative has been created." /></div>
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
                  <span className={"rounded-full px-2.5 py-1 text-xs font-semibold " + (project.status === "CLOSED" || project.status === "DONE" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800")}>{project.status === "CLOSED" ? "Closed" : project.status === "DONE" ? "Done" : "Active"}</span>
                </div>

                <p className="mt-4 line-clamp-3 flex-1 text-sm leading-6 text-muted-foreground">{project.description || "No project description has been added."}</p>

                <div className="mt-5">
                  <div className="flex items-center justify-between text-xs"><span className="flex items-center gap-1.5 text-muted-foreground"><ListTodo className="size-4" aria-hidden="true" />Task progress</span><span className="font-semibold tabular-nums">{done}/{tasks.length}</span></div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary"><div className={"h-full rounded-full " + (progress === 100 ? "bg-emerald-600" : "bg-primary")} style={{ width: progress + "%" }} /></div>
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
