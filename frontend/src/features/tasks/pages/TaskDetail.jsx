import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, LockKeyhole, MessageSquareText, ReceiptIndianRupee } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ContentState } from "@/components/common/ContentState";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";

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

  // Fetch Task Details using direct endpoint with fallback
  const { data: taskData, isPending: taskLoading, isError: taskError, refetch } = useQuery({
    queryKey: ['tasks', id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/tasks/${id}`, { credentials: "include" });
      if (res.ok) {
        return res.json();
      }
      // Fallback to project search if direct task endpoint fails
      const fallbackRes = await fetch(`/api/v1/projects`, { credentials: "include" });
      if (fallbackRes.ok) {
        const json = await fallbackRes.json();
        const projects = json.data || [];
        for (const p of projects) {
          const found = (p.tasks || []).find(t => t.id === id);
          if (found) return { data: { ...found, project: p } };
        }
      }
      throw new Error("Task not found");
    }
  });

  // Real-time task chat messages from backend
  const { data: messages = [] } = useQuery({
    queryKey: ['tasks', id, 'messages'],
    queryFn: async () => {
      const res = await fetch(`/api/v1/tasks/${id}/messages`, { credentials: "include" });
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    },
    refetchInterval: 3000,
  });

  const task = taskData?.data;
  usePageTitle(task?.title || "Volunteer task");

  const updateStatusMutation = useMutation({
    mutationFn: async (status) => {
      const res = await fetch(`/api/v1/tasks/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Could not update task status");
      return res.json();
    },
    onSuccess: (data, newStatus) => {
      queryClient.setQueryData(['tasks', id], {
        data: { ...task, status: newStatus }
      });
      toast.success(`Task marked ${newStatus.replace('_', ' ').toLowerCase()}.`);
    },
    onError: () => toast.error("Could not update the task status."),
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (text) => {
      const clientMsgId = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const res = await fetch(`/api/v1/tasks/${id}/messages`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text, clientMsgId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || "Could not post message");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', id, 'messages'] });
    },
    onError: (err) => {
      toast.error(err.message || "Could not send message");
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    sendMessageMutation.mutate(chatMessage.trim());
    setChatMessage("");
  };

  if (taskLoading) return <div className="page-container py-12" role="status" aria-label="Loading task"><Skeleton className="h-8 w-60" /><div className="mt-6 grid gap-6 lg:grid-cols-3"><Skeleton className="h-96 rounded-2xl" /><Skeleton className="h-96 rounded-2xl lg:col-span-2" /></div></div>;
  if (taskError || !task) return <div className="page-container py-16"><ContentState error title="We couldn’t load this task." description="It may have moved or is no longer assigned to you." action={refetch} /></div>;

  return (
    <div className="page-container flex min-h-[calc(100vh-11rem)] flex-col py-8">
      {/* Top Breadcrumb & Task Header */}
      <div className="mb-4 flex items-center justify-between">
        <Link to="/volunteer" className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-primary hover:underline">
          <ArrowLeft className="size-4" /> Volunteer space
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Project</span>
          <span className="rounded-full border border-border bg-secondary px-2.5 py-1 text-xs font-medium">
            {task.project?.name}
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">

        {/* Left Pane: Task Details & Status Controls */}
        <div className="lg:w-1/3 flex flex-col gap-5 overflow-y-auto">
          <div className="rounded-2xl border border-border bg-card p-6">
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

            <h1 className="mb-3 font-display text-3xl font-semibold leading-snug tracking-tight">
              {task.title}
            </h1>

            <p className="mb-6 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
              {task.description}
            </p>

            <div className="space-y-4 pt-4 border-t border-[var(--color-line)]">
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Due date
                </p>
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <CalendarDays className="size-4 text-primary" /> {task.dueAt || task.dueDate ? new Date(task.dueAt || task.dueDate).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : "No due date"}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Update status
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
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-card text-foreground hover:bg-secondary'
                      }`}
                    >
                      {status.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <Button asChild variant="outline" className="w-full"><Link to="/volunteer/claims/new"><ReceiptIndianRupee aria-hidden="true" /> Submit expense claim</Link></Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Pane: Strict Task-Scoped Team Chat */}
        <div className="flex min-h-0 flex-col rounded-2xl border border-border bg-card lg:w-2/3">
          
          {/* Channel Header with Security Isolation Badge */}
          <div className="rounded-t-2xl border-b border-border bg-secondary/40 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-semibold">
                  <MessageSquareText className="size-4 text-primary" /><span>Task Discussion</span>
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Team chat for <span className="font-semibold text-foreground">{task.title}</span>
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-primary">
                <LockKeyhole className="size-3" /> Assignees & Leads Only
              </div>
            </div>
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex min-h-48 flex-col items-center justify-center text-center text-sm text-muted-foreground">
                <MessageSquareText className="mb-3 size-8 text-primary/40" />
                <p>No messages yet. Send the first update!</p>
              </div>
            ) : null}
            {messages.map((msg) => {
              const isMe = msg.sender?.id === user?.id || (user?.name && msg.sender?.name === user.name) || (typeof msg.sender === 'string' && msg.sender.includes(user?.name || '---'));
              const senderName = msg.sender?.name || (typeof msg.sender === 'string' ? msg.sender : 'Volunteer');
              const messageText = msg.body || msg.content;
              const timeString = new Date(msg.createdAt || msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <div key={msg.id} className={`flex flex-col ${msg.isSystem ? 'items-center my-3' : isMe ? 'items-end' : 'items-start'}`}>
                  {msg.isSystem ? (
                    <span className="text-[11px] text-muted-foreground bg-secondary border border-border px-3 py-1 rounded-full font-medium">
                      {messageText}
                    </span>
                  ) : (
                    <div className={`max-w-[75%] rounded-2xl p-3.5 shadow-xs ${
                      isMe 
                        ? 'bg-primary text-primary-foreground rounded-br-none' 
                        : 'bg-secondary/70 border border-border text-foreground rounded-bl-none'
                    }`}>
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <span className={`text-xs font-bold ${isMe ? 'text-blue-100' : 'text-primary'}`}>
                          {senderName}
                        </span>
                        <span className={`text-[10px] ${isMe ? 'text-blue-200' : 'text-muted-foreground'}`}>
                          {timeString}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{messageText}</p>
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Composer */}
          <div className="p-4 border-t border-border bg-card rounded-b-2xl">
            <form onSubmit={handleSend} className="flex gap-2">
              <Input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Type an update for the task team…"
                disabled={sendMessageMutation.isPending || task.status === 'DONE'}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={!chatMessage.trim() || sendMessageMutation.isPending || task.status === 'DONE'}
              >
                {sendMessageMutation.isPending ? "Sending…" : "Send"}
              </Button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
