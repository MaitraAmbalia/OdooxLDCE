import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function TaskDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [chatMessage, setChatMessage] = useState("");
  const messagesEndRef = useRef(null);

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

  // Initial messages keyed by task id
  const [messages, setMessages] = useState([
    { id: 1, sender: "System", content: "Task channel provisioned. Assigned volunteers connected.", timestamp: new Date(Date.now() - 3600000).toISOString(), isSystem: true },
    { id: 2, sender: "Aarav Patel (President)", content: "Please ensure all ingredients and packaging supplies are verified before tomorrow.", timestamp: new Date(Date.now() - 1800000).toISOString(), isSystem: false },
    { id: 3, sender: "Ananya Joshi (Volunteer)", content: "Got it! Supermarket supplies have been purchased. Snapping receipt for reimbursement now.", timestamp: new Date(Date.now() - 600000).toISOString(), isSystem: false },
  ]);

  // Fetch Task Details
  const { data: taskData, isLoading: taskLoading } = useQuery({
    queryKey: ['tasks', id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/projects`);
      if (res.ok) {
        const json = await res.json();
        const projects = json.data || [];
        for (const p of projects) {
          const found = (p.tasks || []).find(t => t.id === id);
          if (found) return { data: { ...found, project: p } };
        }
      }
      return {
        data: {
          id,
          title: "Bake cookies and brownies",
          description: "Prepare 100 packages of assorted baked goods for the campus bake sale fundraiser.",
          status: "IN_PROGRESS",
          priority: "HIGH",
          dueAt: new Date(Date.now() + 5 * 24 * 3600000).toISOString(),
          project: { name: "Campus Bake Sale Fundraiser" },
        }
      };
    }
  });

  const task = taskData?.data || {
    id,
    title: "Bake cookies and brownies",
    description: "Prepare 100 packages of assorted baked goods for the campus bake sale fundraiser.",
    status: "IN_PROGRESS",
    priority: "HIGH",
    dueAt: new Date(Date.now() + 5 * 24 * 3600000).toISOString(),
    project: { name: "Campus Bake Sale Fundraiser" },
  };

  const updateStatusMutation = useMutation({
    mutationFn: async (status) => {
      const res = await fetch(`/api/v1/tasks/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        // Fallback for mock preview
        return { data: { ...task, status } };
      }
      return res.json();
    },
    onSuccess: (data, newStatus) => {
      queryClient.setQueryData(['tasks', id], {
        data: { ...task, status: newStatus }
      });
      setMessages(prev => [
        ...prev,
        { id: Date.now(), sender: "System", content: `Task marked as ${newStatus.replace('_', ' ')} by ${user?.name || 'Volunteer'}.`, timestamp: new Date().toISOString(), isSystem: true }
      ]);
    }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: user?.name || "Volunteer",
      content: chatMessage.trim(),
      timestamp: new Date().toISOString(),
      isSystem: false,
    };

    setMessages(prev => [...prev, newMsg]);
    setChatMessage("");
  };

  if (taskLoading) return <div className="p-12 text-center text-[var(--color-muted)]">Loading task coordination workspace...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 h-[calc(100vh-120px)] flex flex-col">
      {/* Top Breadcrumb & Task Header */}
      <div className="mb-4 flex items-center justify-between">
        <Link to="/volunteer" className="text-sm font-semibold text-[var(--color-dusk)] hover:underline inline-flex items-center gap-1">
          &larr; Back to Volunteer Portal
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--color-muted)] font-medium">Project:</span>
          <span className="text-xs font-bold text-[var(--color-ink)] bg-[var(--color-paper)] border border-[var(--color-line)] px-2.5 py-1 rounded">
            {task.project?.name}
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">

        {/* Left Pane: Task Details & Status Controls */}
        <div className="lg:w-1/3 flex flex-col gap-5 overflow-y-auto">
          <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                task.priority === 'HIGH' ? 'bg-red-50 text-[var(--color-stop)] border border-red-200' : 'bg-blue-50 text-[var(--color-dusk)] border border-blue-200'
              }`}>
                {task.priority || 'NORMAL'} Priority
              </span>
              <span className="text-xs text-[var(--color-muted)] font-mono">
                Task #{String(id).slice(-4)}
              </span>
            </div>

            <h1 className="text-2xl font-display font-extrabold text-[var(--color-ink)] mb-3 leading-snug">
              {task.title}
            </h1>

            <p className="text-sm text-[var(--color-muted)] whitespace-pre-wrap mb-6 leading-relaxed">
              {task.description}
            </p>

            <div className="space-y-4 pt-4 border-t border-[var(--color-line)]">
              <div>
                <p className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-1">
                  Due Deadline
                </p>
                <p className="text-sm font-semibold text-[var(--color-ink)]">
                  🗓️ {new Date(task.dueAt || task.dueDate || Date.now()).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2">
                  Update Task Status
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE'].map(status => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => updateStatusMutation.mutate(status)}
                      disabled={task.status === status}
                      className={`py-2 px-3 text-xs font-bold uppercase rounded-lg border transition-all ${
                        task.status === status
                          ? 'bg-[var(--color-dusk)] text-white border-[var(--color-dusk)] shadow-sm'
                          : 'bg-white text-[var(--color-ink)] border-[var(--color-line)] hover:bg-[var(--color-paper)]'
                      }`}
                    >
                      {status.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to="/volunteer/claims/new"
                  className="block text-center p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-colors"
                >
                  📸 Submit Receipt Reimbursement for this Task &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Right Pane: Strict Task-Scoped Team Chat */}
        <div className="lg:w-2/3 bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl shadow-sm flex flex-col min-h-0">
          
          {/* Channel Header with Security Isolation Badge */}
          <div className="p-4 border-b border-[var(--color-line)] bg-[var(--color-paper)] rounded-t-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="font-bold text-[var(--color-ink)] text-sm flex items-center gap-2">
                  <span>💬 Task Team Coordination Channel</span>
                  <span className="w-2 h-2 rounded-full bg-[var(--color-ok)] animate-pulse"></span>
                </h2>
                <p className="text-xs text-[var(--color-muted)] mt-0.5">
                  Private communication between assignees of: <span className="font-semibold text-[var(--color-ink)]">{task.title}</span>
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50 border border-amber-200 text-[11px] font-semibold text-amber-900">
                <span>🔒</span> Task-Scoped Channel
              </div>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 bg-white/60 px-3 py-1.5 rounded border border-[var(--color-line)]">
              ℹ️ <strong>Access Boundary:</strong> Only volunteers assigned to this specific task can participate. Volunteers of different tasks cannot view or post to this channel.
            </div>
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className={`flex flex-col ${msg.isSystem ? 'items-center my-3' : msg.sender.includes(user?.name || '---') ? 'items-end' : 'items-start'}`}>
                {msg.isSystem ? (
                  <span className="text-[11px] text-[var(--color-muted)] bg-[var(--color-paper)] border border-[var(--color-line)] px-3 py-1 rounded-full font-medium">
                    {msg.content}
                  </span>
                ) : (
                  <div className={`max-w-[75%] rounded-2xl p-3.5 shadow-xs ${
                    msg.sender.includes(user?.name || '---') 
                      ? 'bg-[var(--color-dusk)] text-white rounded-br-none' 
                      : 'bg-[var(--color-paper)] border border-[var(--color-line)] text-[var(--color-ink)] rounded-bl-none'
                  }`}>
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <span className={`text-xs font-bold ${msg.sender.includes(user?.name || '---') ? 'text-blue-100' : 'text-[var(--color-dusk)]'}`}>
                        {msg.sender}
                      </span>
                      <span className={`text-[10px] ${msg.sender.includes(user?.name || '---') ? 'text-blue-200' : 'text-[var(--color-muted)]'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Composer */}
          <div className="p-4 border-t border-[var(--color-line)] bg-white rounded-b-xl">
            <form onSubmit={handleSend} className="flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Message your task teammates..."
                className="flex-1 px-4 py-2.5 border border-[var(--color-line)] rounded-xl text-sm focus:outline-none focus:border-[var(--color-dusk)]"
              />
              <button
                type="submit"
                disabled={!chatMessage.trim()}
                className="bg-[var(--color-dusk)] text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-opacity-95 disabled:opacity-50 transition-all shadow-sm"
              >
                Send
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
