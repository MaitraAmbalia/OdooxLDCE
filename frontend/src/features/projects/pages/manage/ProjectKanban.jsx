import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function ProjectKanban() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const { data: projectData, isLoading: projectLoading } = useQuery({
    queryKey: ['projects', id],
    queryFn: async () => {
      // API endpoint: GET /projects/:id
      const res = await fetch(`/api/v1/projects/${id}`);
      if (!res.ok) throw new Error("Failed to fetch project");
      return res.json();
    }
  });

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['projects', id, 'tasks'],
    queryFn: async () => {
      // API endpoint: GET /tasks?projectId=:id
      const res = await fetch(`/api/v1/tasks?projectId=${id}`);
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    }
  });

  const updateTaskStatus = useMutation({
    mutationFn: async ({ taskId, status }) => {
      // API endpoint: PATCH /tasks/:id/status
      console.log(`Updating task ${taskId} to ${status}`);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', id, 'tasks'] });
    }
  });

  if (projectLoading || tasksLoading) return <div className="p-8 text-center text-[var(--color-muted)]">Loading board...</div>;

  const project = projectData?.data || {};
  const allTasks = tasksData?.data || [];

  const columns = [
    { id: 'TODO', label: 'To Do', color: 'bg-gray-100', dot: 'bg-gray-400' },
    { id: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-50', dot: 'bg-[var(--color-info)]' },
    { id: 'BLOCKED', label: 'Blocked', color: 'bg-red-50', dot: 'bg-[var(--color-stop)]' },
    { id: 'DONE', label: 'Done', color: 'bg-green-50', dot: 'bg-[var(--color-ok)]' }
  ];

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData("taskId", taskId);
  };

  const handleDrop = (e, status) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) {
      updateTaskStatus.mutate({ taskId, status });
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div className="h-full min-h-screen bg-[var(--color-paper)] p-4 sm:p-6 lg:p-8 flex flex-col">
      <div className="mb-8">
        <Link to="/manage/projects" className="text-sm font-medium text-[var(--color-dusk)] hover:underline inline-block mb-2">
          &larr; Back to Projects
        </Link>
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-display font-extrabold text-[var(--color-ink)]">{project.name}</h1>
          <button className="bg-[var(--color-dusk)] text-white px-4 py-2 rounded-[6px] text-sm font-medium hover:bg-opacity-90 transition-opacity">
            + Add Task
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-6 min-w-max h-full pb-4">
          {columns.map(col => {
            const colTasks = allTasks.filter(t => t.status === col.id);
            return (
              <div
                key={col.id}
                className={`w-80 flex flex-col rounded-[10px] border border-[var(--color-line)] ${col.color}`}
                onDrop={(e) => handleDrop(e, col.id)}
                onDragOver={handleDragOver}
              >
                <div className="p-4 border-b border-[var(--color-line)] bg-white/50 rounded-t-[10px] flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${col.dot}`}></div>
                    <h2 className="font-semibold text-[var(--color-ink)]">{col.label}</h2>
                  </div>
                  <span className="text-sm font-medium text-[var(--color-muted)] bg-white px-2 py-0.5 rounded-full border border-[var(--color-line)]">
                    {colTasks.length}
                  </span>
                </div>

                <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                  {colTasks.map(task => {
                    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';
                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        className={`bg-white p-4 rounded-[6px] border shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${isOverdue ? 'border-red-300' : 'border-[var(--color-line)]'}`}
                      >
                        <h3 className="font-medium text-[var(--color-ink)] mb-2">{task.title}</h3>

                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[var(--color-dusk)] text-white flex items-center justify-center text-[11px] font-bold" title={task.assignee}>
                              {task.assignee ? task.assignee.charAt(0) : '?'}
                            </div>
                            <span className="text-xs text-[var(--color-muted)] truncate max-w-[100px]">{task.assignee || 'Unassigned'}</span>
                          </div>

                          {task.dueDate && (
                            <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded ${isOverdue ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                              {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
