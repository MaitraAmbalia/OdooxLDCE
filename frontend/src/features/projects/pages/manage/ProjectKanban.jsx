import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, GripVertical, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ContentState } from "@/components/common/ContentState";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";

const COLUMNS = [
  { id: "TODO", label: "To do", accent: "bg-slate-400", surface: "bg-slate-50" },
  { id: "IN_PROGRESS", label: "In progress", accent: "bg-blue-500", surface: "bg-blue-50/60" },
  { id: "BLOCKED", label: "Blocked", accent: "bg-red-500", surface: "bg-red-50/60" },
  { id: "DONE", label: "Done", accent: "bg-emerald-600", surface: "bg-emerald-50/60" },
];

function assigneeNames(task) {
  const names = (task.assignees || []).filter((entry) => !entry.removedAt).map((entry) => entry.user?.name).filter(Boolean);
  if (names.length) return names.join(", ");
  return task.assignee || "Unassigned";
}

export default function ProjectKanban() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const { data: projectData, isPending, isError, refetch } = useQuery({
    queryKey: ["projects", id],
    queryFn: async () => {
      const response = await fetch("/api/v1/projects/" + id, { credentials: "include" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error?.message || "Failed to fetch project");
      return json;
    },
  });

  const project = projectData?.data;
  usePageTitle(project?.name || "Project board");

  const updateTaskStatus = useMutation({
    mutationFn: async ({ taskId, status }) => {
      const response = await fetch("/api/v1/tasks/" + taskId + "/status", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error?.message || "Could not update task");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Task status updated.");
    },
    onError: (error) => toast.error(error.message || "Could not update task."),
  });

  if (isPending) {
    return <div className="page-container py-12" role="status" aria-label="Loading project board"><Skeleton className="h-9 w-64" /><div className="mt-8 flex gap-5 overflow-hidden"><Skeleton className="h-[32rem] min-w-72 rounded-2xl" /><Skeleton className="h-[32rem] min-w-72 rounded-2xl" /><Skeleton className="h-[32rem] min-w-72 rounded-2xl" /></div></div>;
  }

  if (isError || !project) {
    return <div className="page-container py-16"><ContentState error title="This project isn’t available." description="We couldn’t load the task board." action={refetch} /></div>;
  }

  const tasks = project.tasks || [];
  const isClosed = project.status === "CLOSED" || project.status === "DONE";

  const handleDrop = (event, status) => {
    event.preventDefault();
    const taskId = event.dataTransfer.getData("text/task-id");
    const task = tasks.find((entry) => entry.id === taskId);
    if (taskId && task?.status !== status && !isClosed) updateTaskStatus.mutate({ taskId, status });
  };

  return (
    <div className="page-container py-12 sm:py-16">
      <Button asChild variant="ghost" className="mb-6 -ml-3"><Link to="/manage/projects"><ArrowLeft aria-hidden="true" /> Back to projects</Link></Button>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="mb-2 text-sm font-medium text-primary">{project.type ? project.type.replaceAll("_", " ") : "Project board"}</p><h1 className="font-display text-4xl font-semibold tracking-tight">{project.name}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{project.description || "Move tasks through the workflow as work progresses."}</p></div>
        <span className={"w-fit rounded-full px-3 py-1.5 text-xs font-semibold " + (isClosed ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800")}>{isClosed ? "Closed project" : tasks.length + " tasks"}</span>
      </div>

      {isClosed && <div className="mt-6 rounded-xl border border-border bg-secondary/40 p-4 text-sm text-muted-foreground" role="status">This project is closed. Its board is available as a read-only record.</div>}

      <div className="mt-8 overflow-x-auto pb-4" aria-label="Project task board">
        <div className="flex min-w-max gap-5">
          {COLUMNS.map((column) => {
            const columnTasks = tasks.filter((task) => task.status === column.id);
            return (
              <section key={column.id} className={"flex min-h-[28rem] w-[82vw] max-w-80 flex-col rounded-2xl border border-border " + column.surface} onDragOver={(event) => { if (!isClosed) event.preventDefault(); }} onDrop={(event) => handleDrop(event, column.id)} aria-labelledby={"column-" + column.id}>
                <div className="flex items-center justify-between border-b border-border bg-card/80 px-4 py-3.5">
                  <div className="flex items-center gap-2"><span className={"size-2.5 rounded-full " + column.accent} /><h2 id={"column-" + column.id} className="font-semibold">{column.label}</h2></div>
                  <span className="rounded-full border border-border bg-card px-2 py-0.5 text-xs font-medium tabular-nums">{columnTasks.length}</span>
                </div>

                <div className="flex-1 space-y-3 p-3">
                  {columnTasks.length === 0 && <div className="rounded-xl border border-dashed border-border bg-card/40 px-4 py-8 text-center text-xs text-muted-foreground">No tasks in this stage.</div>}
                  {columnTasks.map((task) => {
                    const dueAt = task.dueAt || task.dueDate;
                    const isOverdue = dueAt && new Date(dueAt) < new Date() && task.status !== "DONE";
                    const people = assigneeNames(task);
                    return (
                      <article key={task.id} draggable={!isClosed} onDragStart={(event) => event.dataTransfer.setData("text/task-id", task.id)} className={"rounded-xl border bg-card p-4 shadow-xs transition hover:shadow-md " + (isOverdue ? "border-destructive/40" : "border-border")}>
                        <div className="flex items-start gap-2"><GripVertical className={"mt-0.5 size-4 shrink-0 text-muted-foreground " + (isClosed ? "opacity-30" : "cursor-grab")} aria-hidden="true" /><div className="min-w-0 flex-1"><h3 className="font-medium leading-5">{task.title}</h3>{task.description && <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">{task.description}</p>}</div></div>

                        <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                          <p className="flex items-center gap-2"><UserRound className="size-3.5" aria-hidden="true" /><span className="truncate">{people}</span></p>
                          {dueAt && <p className={"flex items-center gap-2 " + (isOverdue ? "font-medium text-destructive" : "")}><CalendarDays className="size-3.5" aria-hidden="true" />{isOverdue ? "Overdue · " : ""}{new Date(dueAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</p>}
                        </div>

                        <label htmlFor={"task-status-" + task.id} className="sr-only">Status for {task.title}</label>
                        <select id={"task-status-" + task.id} value={task.status} disabled={isClosed || updateTaskStatus.isPending} onChange={(event) => updateTaskStatus.mutate({ taskId: task.id, status: event.target.value })} className="mt-4 h-9 w-full rounded-md border border-input bg-background px-2 text-xs font-medium outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50">
                          {COLUMNS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                        </select>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
