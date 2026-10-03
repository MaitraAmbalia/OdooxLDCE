import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function TaskDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [chatMessage, setChatMessage] = useState("");
  const messagesEndRef = useRef(null);

  // Fetch Task
  const { data: taskData, isLoading: taskLoading } = useQuery({
    queryKey: ['tasks', id],
    queryFn: async () => {
      // API endpoint: GET /tasks/:id
      const res = await fetch(`/api/v1/tasks/${id}`);
      if (!res.ok) throw new Error("Failed to fetch task");
      return res.json();
    }
  });

  // Fetch Chat Messages (in a real app, this would use Infinite Query and listen to Socket.io)
  const { data: chatData } = useQuery({
    queryKey: ['chat', id],
    queryFn: async () => {
      // Mock data for chat
      return { data: [
        { id: 1, sender: "System", content: "Task created and assigned to team.", timestamp: "2026-10-01T10:00:00Z", isSystem: true },
        { id: 2, sender: "Aarav Shah", content: "I've started calling the caterers. Should have an update by tomorrow.", timestamp: "2026-10-01T14:30:00Z", isSystem: false },
      ]};
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status) => {
      // API endpoint: PATCH /tasks/:id/status
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', id] });
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content) => {
      // Send via socket or POST /chat/channels/:id/messages
      console.log("Sending chat message:", content);
      return { id: Math.random(), content, sender: "Me", timestamp: new Date().toISOString() };
    },
    onSuccess: (newMessage) => {
      // Optimistic update
      queryClient.setQueryData(['chat', id], (old) => ({
        ...old,
        data: [...(old?.data || []), newMessage]
      }));
      setChatMessage("");
    }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatData]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    sendMessageMutation.mutate(chatMessage);
  };

  if (taskLoading) return <div className="p-8 text-center">Loading task...</div>;

  const task = taskData?.data || {};
  const messages = chatData?.data || [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 h-[calc(100vh-80px)] flex flex-col">
      <div className="mb-4">
        <Link to="/volunteer" className="text-sm font-medium text-[var(--color-dusk)] hover:underline">
          &larr; Back to Tasks
        </Link>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        
        {/* Left: Task Details */}
        <div className="lg:w-1/3 flex flex-col gap-6 overflow-y-auto">
          <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[10px] p-6 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs text-[var(--color-muted)] font-medium uppercase tracking-wider">{task.project?.name}</span>
            </div>
            <h1 className="text-2xl font-display font-bold text-[var(--color-ink)] mb-4">{task.title}</h1>
            
            <p className="text-sm text-[var(--color-ink)] whitespace-pre-wrap mb-6">{task.description}</p>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider mb-1">Due Date</p>
                <p className="text-sm font-medium text-[var(--color-ink)]">{new Date(task.dueDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
              </div>
              
              <div>
                <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider mb-2">Update Status</p>
                <div className="grid grid-cols-2 gap-2">
                  {['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE'].map(status => (
                    <button
                      key={status}
                      onClick={() => updateStatusMutation.mutate(status)}
                      disabled={task.status === status}
                      className={`py-2 text-xs font-bold uppercase rounded-[6px] border transition-colors ${
                        task.status === status 
                          ? 'bg-[var(--color-dusk)] text-white border-[var(--color-dusk)]' 
                          : 'bg-white text-[var(--color-ink)] border-[var(--color-line)] hover:bg-gray-50'
                      }`}
                    >
                      {status.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Chat Interface */}
        <div className="lg:w-2/3 bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[10px] shadow-sm flex flex-col min-h-[400px]">
          <div className="p-4 border-b border-[var(--color-line)] bg-[var(--color-paper)]">
            <h2 className="font-semibold text-[var(--color-ink)] flex items-center gap-2">
              Team Chat <span className="w-2 h-2 rounded-full bg-[var(--color-ok)]"></span>
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className={`flex flex-col ${msg.isSystem ? 'items-center my-4' : msg.sender === 'Me' ? 'items-end' : 'items-start'}`}>
                {msg.isSystem ? (
                  <span className="text-xs text-[var(--color-muted)] bg-gray-100 px-3 py-1 rounded-full">{msg.content}</span>
                ) : (
                  <div className={`max-w-[80%] ${msg.sender === 'Me' ? 'bg-[var(--color-dusk)] text-white' : 'bg-[var(--color-paper)] border border-[var(--color-line)] text-[var(--color-ink)]'} rounded-[10px] p-3`}>
                    {msg.sender !== 'Me' && <p className="text-xs font-bold mb-1 opacity-75">{msg.sender}</p>}
                    <p className="text-sm">{msg.content}</p>
                    <p className={`text-[10px] mt-2 text-right ${msg.sender === 'Me' ? 'text-white/70' : 'text-[var(--color-muted)]'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="p-4 border-t border-[var(--color-line)] bg-white">
            <form onSubmit={handleSend} className="flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Type a message to your team..."
                className="flex-1 px-4 py-2 border border-[var(--color-line)] rounded-full text-sm focus:outline-none focus:border-[var(--color-dusk)] focus:ring-1 focus:ring-[var(--color-dusk)]"
              />
              <button 
                type="submit" 
                disabled={!chatMessage.trim() || sendMessageMutation.isPending}
                className="bg-[var(--color-dusk)] text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-opacity-90 disabled:opacity-50"
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
