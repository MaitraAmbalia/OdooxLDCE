import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ArrowRight, 
  CalendarDays, 
  CheckCircle2, 
  ListTodo, 
  FolderKanban as FolderKanbanIcon,
  Plus, 
  FolderPlus,
  UsersRound,
  Search,
  Check,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { ContentState } from "@/components/common/ContentState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { usePageTitle } from "@/hooks/usePageTitle";

function projectProgress(project) {
  const tasks = project.tasks || [];
  if (!tasks.length) return 0;
  return Math.round((tasks.filter((task) => task.status === "DONE").length / tasks.length) * 100);
}

export default function ProjectList() {
  usePageTitle("Projects & Tasks");
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  // Form states
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [taskDraft, setTaskDraft] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    dueAt: "",
    assigneeUserIds: [],
  });
  const [volunteerSearch, setVolunteerSearch] = useState("");

  const [projectDraft, setProjectDraft] = useState({
    name: "",
    description: "",
    type: "INITIATIVE",
    endDate: "",
  });

  // Handle URL query trigger (?action=new-task)
  useEffect(() => {
    if (searchParams.get("action") === "new-task") {
      setIsTaskModalOpen(true);
    }
  }, [searchParams]);

  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false);
    if (searchParams.get("action")) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("action");
      setSearchParams(nextParams, { replace: true });
    }
  };

  // Queries
  const { data: projectsData, isPending, isError, refetch } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await fetch("/api/v1/projects", { credentials: "include" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error?.message || "Failed to fetch projects");
      return json;
    },
  });

  const { data: volunteersData } = useQuery({
    queryKey: ["volunteers", "active-candidates"],
    queryFn: async () => {
      const response = await fetch("/api/v1/volunteers?limit=100", { credentials: "include" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error?.message || "Could not load volunteers");
      return json;
    },
  });

  const projects = projectsData?.data || [];
  const activeProjects = projects.filter((p) => p.status !== "CLOSED" && p.status !== "DONE");

  // Filter volunteers that are eligible: active volunteer status + active membership
  const eligibleVolunteers = (volunteersData?.data || []).filter(
    (v) => v.status === "ACTIVE" && v.user?.memberships?.length
  );

  const filteredVolunteers = eligibleVolunteers.filter((v) => {
    const q = volunteerSearch.toLowerCase().trim();
    if (!q) return true;
    const nameMatch = v.user?.name?.toLowerCase().includes(q);
    const emailMatch = v.user?.email?.toLowerCase().includes(q);
    const studentMatch = v.user?.studentId?.toLowerCase().includes(q);
    const skillsMatch = Array.isArray(v.skills) && v.skills.some((s) => s.toLowerCase().includes(q));
    return nameMatch || emailMatch || studentMatch || skillsMatch;
  });

  // Set default project when list loads or modal opens
  useEffect(() => {
    if (!selectedProjectId && activeProjects.length > 0) {
      setSelectedProjectId(activeProjects[0].id);
    }
  }, [activeProjects, selectedProjectId]);

  // Mutations
  const createTaskMutation = useMutation({
    mutationFn: async (payload) => {
      if (!selectedProjectId) throw new Error("Please select a project for this task");
      const response = await fetch(`/api/v1/projects/${selectedProjectId}/tasks`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          dueAt: payload.dueAt ? new Date(payload.dueAt).toISOString() : undefined,
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error?.message || "Could not add task");
      return json.data;
    },
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects", selectedProjectId] });
      toast.success(`Task "${task.title}" added and assignees notified!`);
      setTaskDraft({ title: "", description: "", priority: "MEDIUM", dueAt: "", assigneeUserIds: [] });
      handleCloseTaskModal();
    },
    onError: (error) => toast.error(error.message || "Failed to create task"),
  });

  const createProjectMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await fetch("/api/v1/projects", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          endDate: payload.endDate ? new Date(payload.endDate).toISOString() : undefined,
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error?.message || "Could not create project");
      return json.data;
    },
    onSuccess: (newProj) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success(`Project "${newProj.name}" created successfully!`);
      setSelectedProjectId(newProj.id);
      setProjectDraft({ name: "", description: "", type: "INITIATIVE", endDate: "" });
      setIsProjectModalOpen(false);
    },
    onError: (error) => toast.error(error.message || "Failed to create project"),
  });

  const toggleAssignee = (userId) => {
    setTaskDraft((current) => ({
      ...current,
      assigneeUserIds: current.assigneeUserIds.includes(userId)
        ? current.assigneeUserIds.filter((id) => id !== userId)
        : [...current.assigneeUserIds, userId],
    }));
  };

  const handleSelectAllVolunteers = () => {
    const allFilteredIds = filteredVolunteers.map((v) => v.user.id);
    const allSelected = allFilteredIds.every((id) => taskDraft.assigneeUserIds.includes(id));
    if (allSelected) {
      setTaskDraft((curr) => ({
        ...curr,
        assigneeUserIds: curr.assigneeUserIds.filter((id) => !allFilteredIds.includes(id)),
      }));
    } else {
      setTaskDraft((curr) => ({
        ...curr,
        assigneeUserIds: Array.from(new Set([...curr.assigneeUserIds, ...allFilteredIds])),
      }));
    }
  };

  const handleTaskSubmit = (e) => {
    e.preventDefault();
    if (!taskDraft.title.trim()) {
      toast.error("Please enter a task title");
      return;
    }
    createTaskMutation.mutate(taskDraft);
  };

  const handleProjectSubmit = (e) => {
    e.preventDefault();
    if (!projectDraft.name.trim()) {
      toast.error("Please enter a project name");
      return;
    }
    createProjectMutation.mutate(projectDraft);
  };

  return (
    <div className="page-container py-12 sm:py-16">
      {/* Header with actions */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-sm font-medium text-primary">Team delivery & delegation</p>
          <h1 className="font-display text-4xl font-semibold tracking-tight">Projects & Volunteer Tasks</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Follow active initiatives, organize work boards, and assign tasks directly to club volunteers.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => setIsProjectModalOpen(true)}
            className="cursor-pointer"
          >
            <FolderPlus className="mr-2 size-4" /> New Project
          </Button>
          <Button 
            onClick={() => setIsTaskModalOpen(true)}
            className="cursor-pointer shadow-sm hover:shadow"
          >
            <Plus className="mr-2 size-4" /> Add & Assign Task
          </Button>
        </div>
      </div>

      {/* Projects Grid */}
      {isPending ? (
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading projects">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : isError ? (
        <div className="mt-8">
          <ContentState error title="Projects aren’t available right now." description="We couldn’t load the project portfolio." action={refetch} />
        </div>
      ) : projects.length === 0 ? (
        <div className="mt-8">
          <ContentState 
            icon={FolderKanbanIcon} 
            title="No projects yet." 
            description="Create your first project to start delegating work and assigning tasks to volunteers." 
            action={() => setIsProjectModalOpen(true)}
            actionLabel="Create Project"
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const tasks = project.tasks || [];
            const done = tasks.filter((task) => task.status === "DONE").length;
            const progress = projectProgress(project);
            const endDate = project.endDate || project.dueDate;
            return (
              <Link 
                key={project.id} 
                to={"/manage/projects/" + project.id} 
                className="group flex min-h-64 flex-col rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                      {project.type ? project.type.replaceAll("_", " ") : "Project"}
                    </p>
                    <h2 className="mt-2 font-display text-xl font-semibold">{project.name}</h2>
                  </div>
                  <span className={"rounded-full px-2.5 py-1 text-xs font-semibold " + (project.status === "CLOSED" || project.status === "DONE" ? "bg-success-soft text-success" : "bg-secondary text-primary")}>
                    {project.status === "CLOSED" ? "Closed" : project.status === "DONE" ? "Done" : "Active"}
                  </span>
                </div>

                <p className="mt-4 line-clamp-3 flex-1 text-sm leading-6 text-muted-foreground">
                  {project.description || "No project description has been added."}
                </p>

                <div className="mt-5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <ListTodo className="size-4" aria-hidden="true" />Task progress
                    </span>
                    <span className="font-semibold tabular-nums">{done}/{tasks.length}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                    <div 
                      className={"h-full rounded-full transition-all " + (progress === 100 ? "bg-success" : "bg-primary")} 
                      style={{ width: progress + "%" }} 
                    />
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    {endDate ? (
                      <>
                        <CalendarDays className="size-4" aria-hidden="true" />
                        Ends {new Date(endDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="size-4" aria-hidden="true" />
                        No end date
                      </>
                    )}
                  </span>
                  <span className="flex items-center gap-1 font-medium text-primary">
                    Open board <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Dialog: Add & Assign Task */}
      <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add & Assign Volunteer Task</DialogTitle>
            <DialogDescription>
              Create a task under an initiative and assign it to active club volunteers. Assigned volunteers receive notifications immediately.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleTaskSubmit} className="space-y-5">
            {/* Project Selection */}
            <div>
              <label htmlFor="task-project" className="block text-sm font-medium mb-1.5">
                Target Project <span className="text-destructive">*</span>
              </label>
              {activeProjects.length > 0 ? (
                <div className="flex items-center gap-2">
                  <select
                    id="task-project"
                    required
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="flex-1 h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {activeProjects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.type || "PROJECT"})</option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsTaskModalOpen(false);
                      setIsProjectModalOpen(true);
                    }}
                    className="text-xs"
                  >
                    + New Project
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 rounded-xl border border-dashed border-border bg-secondary/30 text-xs">
                  <span className="text-muted-foreground">No active project exists yet.</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsTaskModalOpen(false);
                      setIsProjectModalOpen(true);
                    }}
                  >
                    Create Project First
                  </Button>
                </div>
              )}
            </div>

            {/* Task Title & Due Date */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="task-title" className="block text-sm font-medium mb-1.5">
                  Task Title <span className="text-destructive">*</span>
                </label>
                <Input
                  id="task-title"
                  required
                  maxLength={160}
                  placeholder="e.g. Set up check-in registration counter"
                  value={taskDraft.title}
                  onChange={(e) => setTaskDraft({ ...taskDraft, title: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="task-due" className="block text-sm font-medium mb-1.5">
                  Due Date & Time
                </label>
                <Input
                  id="task-due"
                  type="datetime-local"
                  value={taskDraft.dueAt}
                  onChange={(e) => setTaskDraft({ ...taskDraft, dueAt: e.target.value })}
                />
              </div>
            </div>

            {/* Priority & Description */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="task-priority" className="block text-sm font-medium mb-1.5">
                  Priority
                </label>
                <select
                  id="task-priority"
                  value={taskDraft.priority}
                  onChange={(e) => setTaskDraft({ ...taskDraft, priority: e.target.value })}
                  className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="task-desc" className="block text-sm font-medium mb-1.5">
                  Instructions & Guidelines
                </label>
                <Textarea
                  id="task-desc"
                  rows={2}
                  placeholder="Provide any clear deliverables, venue locations, or equipment details..."
                  value={taskDraft.description}
                  onChange={(e) => setTaskDraft({ ...taskDraft, description: e.target.value })}
                />
              </div>
            </div>

            {/* Assignees Section */}
            <div className="border-t border-border pt-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
                <div>
                  <h4 className="text-sm font-semibold flex items-center gap-1.5">
                    <UsersRound className="size-4 text-primary" /> Assign Active Volunteers
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {taskDraft.assigneeUserIds.length} volunteer(s) currently selected
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search volunteer or skill..."
                      value={volunteerSearch}
                      onChange={(e) => setVolunteerSearch(e.target.value)}
                      className="h-8 pl-8 text-xs w-48"
                    />
                  </div>
                  {filteredVolunteers.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleSelectAllVolunteers}
                      className="h-8 text-xs"
                    >
                      {filteredVolunteers.every((v) => taskDraft.assigneeUserIds.includes(v.user.id))
                        ? "Deselect All"
                        : "Select All"}
                    </Button>
                  )}
                </div>
              </div>

              {eligibleVolunteers.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-muted/40 p-4 text-center text-xs text-muted-foreground">
                  <AlertCircle className="size-4 inline-block mr-1 text-muted-foreground" />
                  No active member volunteers are available in the directory.
                </div>
              ) : filteredVolunteers.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-muted/40 p-4 text-center text-xs text-muted-foreground">
                  No volunteers matched "{volunteerSearch}".
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 max-h-52 overflow-y-auto pr-1">
                  {filteredVolunteers.map((vol) => {
                    const isSelected = taskDraft.assigneeUserIds.includes(vol.user.id);
                    return (
                      <div
                        key={vol.id}
                        onClick={() => toggleAssignee(vol.user.id)}
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/5 text-foreground"
                            : "border-border hover:bg-secondary/40 text-muted-foreground"
                        }`}
                      >
                        <div
                          className={`mt-0.5 size-4 rounded flex items-center justify-center border transition-colors ${
                            isSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/40 bg-background"
                          }`}
                        >
                          {isSelected && <Check className="size-3 stroke-[3]" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-foreground truncate">{vol.user.name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{vol.user.studentId || vol.user.email}</p>
                          {vol.skills && vol.skills.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {vol.skills.slice(0, 3).map((skill) => (
                                <Badge key={skill} variant="secondary" className="text-[9px] px-1 py-0">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseTaskModal}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createTaskMutation.isPending || !taskDraft.title.trim() || !selectedProjectId}
              >
                {createTaskMutation.isPending ? "Assigning..." : "Create & Assign Task"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Create New Project */}
      <Dialog open={isProjectModalOpen} onOpenChange={setIsProjectModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Initiative or Project</DialogTitle>
            <DialogDescription>
              Start a new club initiative to manage tasks, delegate volunteer work, and track milestones.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleProjectSubmit} className="space-y-4">
            <div>
              <label htmlFor="proj-name" className="block text-sm font-medium mb-1.5">
                Project Name <span className="text-destructive">*</span>
              </label>
              <Input
                id="proj-name"
                required
                placeholder="e.g. Annual Tech Symposium Logistics"
                value={projectDraft.name}
                onChange={(e) => setProjectDraft({ ...projectDraft, name: e.target.value })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="proj-type" className="block text-sm font-medium mb-1.5">
                  Category
                </label>
                <select
                  id="proj-type"
                  value={projectDraft.type}
                  onChange={(e) => setProjectDraft({ ...projectDraft, type: e.target.value })}
                  className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="INITIATIVE">Initiative</option>
                  <option value="EVENT">Event</option>
                  <option value="CAMPAIGN">Campaign</option>
                  <option value="LOGISTICS">Logistics</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="proj-end" className="block text-sm font-medium mb-1.5">
                  Target End Date
                </label>
                <Input
                  id="proj-end"
                  type="date"
                  value={projectDraft.endDate}
                  onChange={(e) => setProjectDraft({ ...projectDraft, endDate: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label htmlFor="proj-desc" className="block text-sm font-medium mb-1.5">
                Scope & Objectives
              </label>
              <Textarea
                id="proj-desc"
                rows={3}
                placeholder="Describe the goals, responsibilities, and expected outcomes of this project..."
                value={projectDraft.description}
                onChange={(e) => setProjectDraft({ ...projectDraft, description: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsProjectModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createProjectMutation.isPending || !projectDraft.name.trim()}>
                {createProjectMutation.isPending ? "Creating..." : "Create Project"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
