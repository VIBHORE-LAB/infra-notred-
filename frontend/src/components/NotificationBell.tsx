import React, { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck, FolderOpen, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { formatDate } from '@/helpers/date';
import { useNotifications } from '@/hooks/useNotifications';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';

const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markRead,
    markAllRead,
    deleteNotification,
  } = useNotifications();

  const visibleNotifications = useMemo(() => notifications.slice(0, 8), [notifications]);

  useEffect(() => {
    void fetchNotifications();
    const timer = window.setInterval(() => {
      void fetchNotifications();
    }, 60000);

    return () => {
      window.clearInterval(timer);
    };
  }, [fetchNotifications]);

  const handleOpenChange = async (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      await fetchNotifications();
    }
  };

  const handleMarkRead = async (notificationId: string) => {
    const success = await markRead(notificationId);
    if (success) {
      toast.success('Notification marked as read.');
    } else {
      toast.error('Unable to update the notification.');
    }
  };

  const handleMarkAllRead = async () => {
    const success = await markAllRead();
    if (success) {
      toast.success('All notifications marked as read.');
    } else {
      toast.error('Unable to update notifications.');
    }
  };

  const handleDelete = async (notificationId: string) => {
    const success = await deleteNotification(notificationId);
    if (success) {
      toast.success('Notification removed.');
    } else {
      toast.error('Unable to delete the notification.');
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon-sm" className="relative rounded-full" aria-label="Open notifications">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-medium text-destructive-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[380px] rounded-3xl p-0">
        <PopoverHeader className="border-b border-border px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <PopoverTitle>Notifications</PopoverTitle>
              <PopoverDescription className="mt-1 text-xs">
                Keep up with announcements, updates, and project actions.
              </PopoverDescription>
            </div>
            <Badge variant="secondary" className="rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.18em]">
              {unreadCount} unread
            </Badge>
          </div>
        </PopoverHeader>

        <div className="max-h-[420px] overflow-y-auto p-3">
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
            </div>
          ) : visibleNotifications.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
              No notifications yet.
            </div>
          ) : (
            <div className="space-y-2">
              {visibleNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`rounded-2xl border p-3 ${
                    notification.isRead
                      ? 'border-border/70 bg-background'
                      : 'border-primary/20 bg-primary/5'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-6 text-foreground">{notification.message}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        <span>{notification.type}</span>
                        <span>{formatDate(notification.createdAt, 'No date')}</span>
                      </div>
                    </div>

                    {!notification.isRead && (
                      <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {notification.projectId && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => {
                          setOpen(false);
                          navigate(`/projects/${notification.projectId}`);
                        }}
                      >
                        <FolderOpen className="h-4 w-4" />
                        Open project
                      </Button>
                    )}

                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => void handleMarkRead(notification.id)}
                      >
                        <CheckCheck className="h-4 w-4" />
                        Mark read
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-xl text-destructive hover:text-destructive"
                      onClick={() => void handleDelete(notification.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {visibleNotifications.length > 0 && (
          <div className="flex items-center justify-between border-t border-border bg-muted/20 px-4 py-3">
            <p className="text-xs text-muted-foreground">Latest {visibleNotifications.length} notifications</p>
            <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => void handleMarkAllRead()}>
              <CheckCheck className="h-4 w-4" />
              Read all
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
