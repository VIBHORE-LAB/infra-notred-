import { useCallback, useState } from 'react';
import instance, { getApiErrorMessage } from '@/api/api';

export interface AppNotification {
  id: string;
  type: string;
  message: string;
  projectId?: string | null;
  meta?: Record<string, unknown>;
  isRead: boolean;
  createdAt?: string | null;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await instance.get('/notifications/');
      const items = (response.data?.data?.notifications ?? []) as AppNotification[];
      setNotifications(items);
      setUnreadCount(response.data?.data?.unreadCount ?? items.filter((item) => !item.isRead).length);
      return items;
    } catch (error: any) {
      setError(getApiErrorMessage(error, 'Failed to fetch notifications'));
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const markRead = useCallback(async (notificationId: string) => {
    setError(null);
    try {
      await instance.put(`/notifications/${notificationId}/read`);
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
      setUnreadCount((current) => Math.max(0, current - 1));
      return true;
    } catch (error: any) {
      setError(getApiErrorMessage(error, 'Failed to mark the notification as read'));
      return false;
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setError(null);
    try {
      await instance.put('/notifications/read-all');
      setNotifications((current) =>
        current.map((notification) => ({ ...notification, isRead: true }))
      );
      setUnreadCount(0);
      return true;
    } catch (error: any) {
      setError(getApiErrorMessage(error, 'Failed to mark all notifications as read'));
      return false;
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId: string) => {
    setError(null);
    try {
      const deletedItem = notifications.find((notification) => notification.id === notificationId);
      await instance.delete(`/notifications/${notificationId}`);
      setNotifications((current) => current.filter((notification) => notification.id !== notificationId));
      if (deletedItem && !deletedItem.isRead) {
        setUnreadCount((current) => Math.max(0, current - 1));
      }
      return true;
    } catch (error: any) {
      setError(getApiErrorMessage(error, 'Failed to delete the notification'));
      return false;
    }
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markRead,
    markAllRead,
    deleteNotification,
  };
};
