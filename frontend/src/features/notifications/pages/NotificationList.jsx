import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import { ContentState } from "@/components/common/ContentState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";
import { toast } from "sonner";

export default function NotificationList() {
  usePageTitle("Notifications");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: notificationsData, isPending, isError, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      // API endpoint: GET /notifications
      const res = await fetch("/api/v1/notifications", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    }
  });

  const notifications = notificationsData?.data || [];
  const unreadCount = notifications.filter((notification) => !notification.readAt).length;

  const markAll = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/v1/notifications/read-all", { method: "POST", credentials: "include" });
      if (!response.ok) throw new Error("Could not update notifications");
      return response.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
    onError: () => toast.error("Could not mark notifications as read."),
  });

  const markSingle = useMutation({
    mutationFn: async (id) => {
      const response = await fetch(`/api/v1/notifications/${id}/read`, { method: "PATCH", credentials: "include" });
      if (!response.ok) throw new Error("Could not update notification");
      return response.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const handleNotificationClick = (notif) => {
    if (!notif.readAt) {
      markSingle.mutate(notif.id);
    }
    if (notif.link) {
      navigate(notif.link);
    }
  };

  return (
    <div className="page-container max-w-3xl py-12 sm:py-16">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-medium text-primary">Stay in the loop</p>
          <h1 className="font-display text-4xl font-semibold tracking-tight">Notifications</h1>
          <p className="mt-2 text-sm text-muted-foreground">{unreadCount ? `${unreadCount} unread update${unreadCount === 1 ? "" : "s"}` : "You’re all caught up."}</p>
        </div>
        {unreadCount ? <Button variant="outline" onClick={() => markAll.mutate()} disabled={markAll.isPending}><CheckCheck aria-hidden="true" />{markAll.isPending ? "Updating…" : "Mark all read"}</Button> : null}
      </div>

      {isPending ? (
        <div className="space-y-3" role="status" aria-label="Loading notifications"><Skeleton className="h-24 rounded-xl" /><Skeleton className="h-24 rounded-xl" /><Skeleton className="h-24 rounded-xl" /></div>
      ) : isError ? (
        <ContentState error title="Notifications aren’t available right now." description="We couldn’t load your updates. Try again in a moment." action={refetch} />
      ) : notifications.length === 0 ? (
        <ContentState title="You’re all caught up." description="New updates about your events, tasks, and claims will appear here." />
      ) : (
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {
          <ul className="divide-y divide-[var(--color-line)]">
            {notifications.map(notif => (
              <li
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-5 transition-colors cursor-pointer ${!notif.readAt ? 'bg-secondary/40 hover:bg-secondary/60' : 'bg-card hover:bg-secondary/20'}`}
              >
                <div className="flex gap-4">
                  <div className="pt-1">
                    {/* Icon based on type */}
                    <div className="flex size-9 items-center justify-center rounded-full bg-secondary text-primary">
                      <Bell className="size-4" aria-hidden="true" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{notif.title}</p>
                      {notif.link && <ExternalLink className="size-3 text-muted-foreground" />}
                    </div>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{notif.body}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {new Date(notif.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {!notif.readAt && (
                    <div className="flex items-center">
                      <span className="size-2 rounded-full bg-primary"><span className="sr-only">Unread</span></span>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        }
      </div>
      )}
    </div>
  );
}
