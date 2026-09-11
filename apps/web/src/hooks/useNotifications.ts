import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { NotificationCategory, NotificationChannel } from '../lib/validations/notification';

export interface NotificationPayload {
  event?: string;
  projectId?: string;
  applicationId?: string;
  invitationId?: string;
  matchId?: string;
  recommendationId?: string;
  status?: string;
  [key: string]: any;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: string;
  payload: NotificationPayload;
  readAt: Date | string | null;
  createdAt: Date | string;
}

export interface NotificationsResponse {
  data: NotificationItem[];
  nextCursor?: string | null;
  unreadCount: number;
}

export function useNotifications(limit = 20) {
  return useInfiniteQuery<NotificationsResponse>({
    queryKey: ['notifications'],
    initialPageParam: undefined,
    queryFn: async ({ pageParam }) => {
      const url = new URL('/api/v1/notifications', window.location.origin);
      url.searchParams.set('limit', limit.toString());
      if (pageParam) {
        url.searchParams.set('cursor', pageParam as string);
      }
      
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('Failed to fetch notifications');
      return res.json();
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/notifications/${id}/read`, { method: 'PUT' });
      if (!res.ok) throw new Error('Failed to mark notification as read');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/v1/notifications/read-all', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to mark all as read');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: ['notificationPreferences'],
    queryFn: async () => {
      const res = await fetch('/api/v1/notifications/preferences');
      if (!res.ok) throw new Error('Failed to fetch notification preferences');
      const json = await res.json();
      return json.data as Record<NotificationCategory, Record<NotificationChannel, boolean>>;
    }
  });
}

export function useUpdateNotificationPreference() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { category: NotificationCategory; channel: NotificationChannel; enabled: boolean }) => {
      const res = await fetch('/api/v1/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      });
      if (!res.ok) throw new Error('Failed to update notification preference');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationPreferences'] });
    }
  });
}
