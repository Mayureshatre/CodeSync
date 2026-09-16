'use client';

import React from 'react';
import Link from 'next/link';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, NotificationItem } from '../../hooks/useNotifications';
import { BellIcon, CheckIcon, CheckCheckIcon, Loader2Icon } from 'lucide-react';

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
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2Icon className="w-8 h-8 text-accent animate-spin" />
        <p className="text-secondary font-medium">Loading notifications...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center bg-error/10 border border-error/20 text-error rounded-2xl max-w-2xl mx-auto">
        <p className="font-medium">Failed to load notifications. Please try again.</p>
      </div>
    );
  }

  const allNotifications = data?.pages.flatMap(page => page.data) || [];
  const unreadCount = data?.pages[0]?.unreadCount || 0;

  if (allNotifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 max-w-3xl mx-auto text-secondary border-2 border-dashed border-border rounded-2xl">
        <div className="w-16 h-16 rounded-2xl bg-surface-elevated border border-border shadow-elevation-low flex items-center justify-center mb-6">
          <BellIcon className="w-8 h-8 text-muted" />
        </div>
        <p className="text-lg">You have no notifications</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-3">
            Notifications
            {unreadCount > 0 && (
              <span className="text-sm px-2.5 py-1 bg-accent/10 text-accent font-semibold rounded-lg border border-accent/20">
                {unreadCount} new
              </span>
            )}
          </h1>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead()}
            disabled={isMarkingAll}
            className="flex items-center justify-center sm:justify-start gap-2 px-4 py-2 text-sm font-medium bg-surface-elevated text-secondary hover:text-accent hover:border-accent transition-all border border-border rounded-xl shadow-elevation-low disabled:opacity-50"
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
              className={`p-5 rounded-2xl border transition-all ${
                isUnread 
                  ? 'bg-surface shadow-elevation-flat border-border/80 hover:border-accent/40 hover:shadow-elevation-overlay' 
                  : 'bg-background border-border/50 opacity-80 hover:opacity-100 hover:border-border'
              }`}
            >
              <div className="flex justify-between items-start gap-4">
                <Link 
                  href={link}
                  onClick={() => {
                    if (isUnread) markRead(notification.id);
                  }}
                  className="flex-1 block group"
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1.5 flex-shrink-0">
                      {isUnread ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-accent shadow-[0_0_8px_rgba(6,182,212,0.4)]" />
                      ) : (
                        <div className="w-2.5 h-2.5 rounded-full border-2 border-muted" />
                      )}
                    </div>
                    <div>
                      <p className={`text-sm mb-1.5 transition-colors ${isUnread ? 'text-primary font-semibold group-hover:text-accent' : 'text-primary font-medium'}`}>
                        {message}
                      </p>
                      <p className="text-muted text-xs font-mono tracking-wide">
                        {new Date(notification.createdAt).toLocaleDateString()} • {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </Link>
                
                {isUnread && (
                  <button
                    onClick={() => markRead(notification.id)}
                    className="p-2.5 text-muted hover:text-accent hover:bg-accent/10 transition-all rounded-xl border border-transparent hover:border-accent/20 flex-shrink-0"
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
        <div className="mt-10 text-center">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="px-6 py-2.5 bg-surface-elevated hover:bg-surface text-primary font-medium rounded-xl transition-all border border-border hover:border-accent hover:text-accent shadow-elevation-low disabled:opacity-50 flex items-center justify-center gap-2 mx-auto"
          >
            {isFetchingNextPage ? <Loader2Icon className="w-4 h-4 animate-spin" /> : null}
            {isFetchingNextPage ? 'Loading more...' : 'Load older notifications'}
          </button>
        </div>
      )}
    </div>
  );
}
