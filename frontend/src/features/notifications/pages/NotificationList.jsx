import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

export default function NotificationList() {
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      // API endpoint: GET /notifications
      const res = await fetch("/api/v1/notifications");
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    }
  });

  const notifications = notificationsData?.data || [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-display font-extrabold text-[var(--color-ink)]">Notifications</h1>
        </div>
        <button className="text-sm text-[var(--color-dusk)] font-medium hover:underline">
          Mark all as read
        </button>
      </div>

      <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[10px] overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-[var(--color-muted)]">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-[var(--color-muted)]">You're all caught up!</div>
        ) : (
          <ul className="divide-y divide-[var(--color-line)]">
            {notifications.map(notif => (
              <li key={notif.id} className={`p-4 transition-colors ${!notif.readAt ? 'bg-[var(--color-paper)]' : 'bg-white hover:bg-gray-50'}`}>
                <div className="flex gap-4">
                  <div className="pt-1">
                    {/* Icon based on type */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs ${
                      notif.type === 'CLAIM_DECIDED' ? 'bg-[var(--color-ok)]' :
                      notif.type === 'TASK_ASSIGNED' ? 'bg-[var(--color-info)]' :
                      'bg-[var(--color-dusk)]'
                    }`}>
                      {notif.type === 'CLAIM_DECIDED' ? '₹' : notif.type === 'TASK_ASSIGNED' ? '✓' : 'i'}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--color-ink)]">{notif.title}</p>
                    <p className="text-sm text-[var(--color-muted)] mt-1">{notif.body}</p>
                    <p className="text-xs text-[var(--color-muted)] mt-2 font-mono">
                      {new Date(notif.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {!notif.readAt && (
                    <div className="flex items-center">
                      <span className="w-2 h-2 rounded-full bg-[var(--color-dusk)]"></span>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
