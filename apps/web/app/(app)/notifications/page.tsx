import React from 'react';
import { NotificationList } from '../../../src/components/notifications/NotificationList';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Notifications - CodeSync',
  description: 'View your notifications',
};

export default function NotificationsPage() {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-[calc(100vh-64px)]">
      <NotificationList />
    </div>
  );
}
