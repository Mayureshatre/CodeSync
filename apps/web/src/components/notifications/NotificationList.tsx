'use client';

import React from 'react';
import Link from 'next/link';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, NotificationItem } from '../../hooks/useNotifications';
import { CheckIcon, CheckCheckIcon, BellIcon, Loader2Icon } from 'lucide-react';

function getNotificationLink(notification: NotificationItem): string {
  const { type, payload } = notification;
  if (payload && payload.projectId) {
    return `/projects/${payload.projectId}`;
  }
  return '#';
}

function getNotificationMessage(notification: NotificationItem): string {
  const { type, payload } = notification;
  switch (type) {
    case 'PROJECT_ACTIVITY':
      if (payload.event === 'project_updated') return 'A project you are a part of was updated.';
      return 'There is new activity on your project.';
    case 'PROJECT_MATCH':
      return 'You have a new project match recommendation!';
    case 'APPLICATION':
      if (payload.event === 'application_submitted') return 'A new application was submitted to your project.';
      if (payload.event === 'application_status_updated') return 'Your application status was updated.';
      if (payload.event === 'application_withdrawn') return 'An application to your project was withdrawn.';
      return 'You have an update regarding an application.';
    case 'INVITATION':
      if (payload.event === 'invitation_received') return 'You received a new project invitation.';
      if (payload.event === 'invitation_responded') return 'Someone responded to your project invitation.';
      return 'You have an update regarding an invitation.';
    case 'SYSTEM':
      return 'You have a new system notification.';
    default:
      return 'You have a new notification.';
  }
}

export function NotificationList() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } = useNotifications();
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead, isPending: isMarkingAll } = useMarkAllNotificationsRead();

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2Icon className="w-8 h-8 text-[#06b6d4] animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center text-red-500">
        Failed to load notifications. Please try again.
      </div>
    );
  }

  const allNotifications = data?.pages.flatMap(page => page.data) || [];
  const unreadCount = data?.pages[0]?.unreadCount || 0;

  if (allNotifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-[#94a3b8] bg-[#181c24] rounded-[12px] border border-[#263042]">
        <BellIcon className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-lg">You have no notifications</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          Notifications
          {unreadCount > 0 && (
            <span className="bg-[#06b6d4] text-white text-xs px-2 py-1 rounded-full font-bold">
              {unreadCount} new
            </span>
          )}
        </h1>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead()}
            disabled={isMarkingAll}
            className="flex items-center gap-2 text-sm text-[#94a3b8] hover:text-white transition-colors"
          >
            <CheckCheckIcon className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      <div className="space-y-4">
        {allNotifications.map((notification) => {
          const isUnread = !notification.readAt;
          const link = getNotificationLink(notification);
          const message = getNotificationMessage(notification);

          return (
            <div
              key={notification.id}
              className={`p-4 rounded-[12px] border transition-colors ${
                isUnread 
                  ? 'bg-[#1e2433] border-[#06b6d4]/50' 
                  : 'bg-[#181c24] border-[#263042] opacity-75'
              }`}
            >
              <div className="flex justify-between items-start gap-4">
                <Link 
                  href={link}
                  onClick={() => {
                    if (isUnread) markRead(notification.id);
                  }}
                  className="flex-1 block hover:opacity-80 transition-opacity"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {isUnread ? (
                        <div className="w-2 h-2 rounded-full bg-[#06b6d4]" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-transparent" />
                      )}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium mb-1">{message}</p>
                      <p className="text-[#94a3b8] text-xs">
                        {new Date(notification.createdAt).toLocaleDateString()} at {new Date(notification.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </Link>
                
                {isUnread && (
                  <button
                    onClick={() => markRead(notification.id)}
                    className="p-2 text-[#94a3b8] hover:text-[#06b6d4] transition-colors rounded-full hover:bg-[#263042]"
                    title="Mark as read"
                  >
                    <CheckIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {hasNextPage && (
        <div className="mt-8 text-center">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="px-6 py-2 bg-[#1e2433] hover:bg-[#263042] text-white rounded-[8px] transition-colors border border-[#263042] disabled:opacity-50"
          >
            {isFetchingNextPage ? 'Loading more...' : 'Load older notifications'}
          </button>
        </div>
      )}
    </div>
  );
}
