import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Search, UserCheck } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AssignVolunteersModal({
  open,
  onOpenChange,
  taskId,
  taskTitle = "",
  initialAssigneeUserIds = [],
}) {
  const queryClient = useQueryClient();
  const [selectedUserIds, setSelectedUserIds] = useState(initialAssigneeUserIds);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setSelectedUserIds(initialAssigneeUserIds);
  }, [initialAssigneeUserIds, open]);

  // Fetch volunteers
  const { data: volunteersData, isPending } = useQuery({
    queryKey: ["volunteers", "task-assignees"],
    queryFn: async () => {
      const res = await fetch("/api/v1/volunteers?limit=100", { credentials: "include" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Could not load volunteers");
      return json;
    },
    enabled: open,
  });

  const activeVolunteers = useMemo(() => {
    const list = volunteersData?.data || [];
    return list.filter(
      (v) => v.status === "ACTIVE" && (v.user?.memberships?.length || v.user?.isMember)
    );
  }, [volunteersData]);

  const filteredVolunteers = useMemo(() => {
    if (!search.trim()) return activeVolunteers;
    const q = search.toLowerCase();
    return activeVolunteers.filter(
      (v) =>
        v.user?.name?.toLowerCase().includes(q) ||
        v.user?.studentId?.toLowerCase().includes(q) ||
        v.user?.email?.toLowerCase().includes(q) ||
        (v.skills || []).some((s) => s.toLowerCase().includes(q))
    );
  }, [activeVolunteers, search]);

  const toggleUser = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const assignMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/tasks/${taskId}/assignees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userIds: selectedUserIds }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to update assignees");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Assignees updated", {
        description: `${selectedUserIds.length} volunteer(s) assigned to this task.`,
      });
      onOpenChange?.(false);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update assignees");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase">
            <UserCheck className="size-4" />
            <span>Task Assignments</span>
          </div>
          <DialogTitle className="text-xl font-display mt-1">
            Assign Volunteers
          </DialogTitle>
          <DialogDescription className="text-xs">
            {taskTitle ? `Assign active student volunteers to "${taskTitle}".` : "Choose volunteers to assign to this task."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          <div className="relative">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search active volunteers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1.5 rounded-xl border border-border bg-secondary/20 p-2">
            {isPending ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                Loading volunteers...
              </div>
            ) : filteredVolunteers.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No active volunteers found.
              </div>
            ) : (
              filteredVolunteers.map((vol) => {
                const isSelected = selectedUserIds.includes(vol.user.id);
                return (
                  <div
                    key={vol.id}
                    onClick={() => toggleUser(vol.user.id)}
                    className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition select-none ${
                      isSelected
                        ? "bg-primary/10 border-primary text-foreground"
                        : "bg-card border-border hover:bg-secondary/50 text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`size-4 rounded flex items-center justify-center shrink-0 border ${
                          isSelected
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-border bg-card"
                        }`}
                      >
                        {isSelected && <Check className="size-3 stroke-[3]" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {vol.user.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {vol.user.studentId || vol.user.email}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary shrink-0 bg-primary/10 px-2 py-0.5 rounded">
                        Assigned
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange?.(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => assignMutation.mutate()}
            disabled={assignMutation.isPending}
            className="font-semibold"
          >
            {assignMutation.isPending ? "Saving…" : `Save (${selectedUserIds.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
