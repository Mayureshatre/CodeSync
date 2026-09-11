import React from 'react';
import { NotificationSettings } from '../../../../src/components/notifications/NotificationSettings';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Notification Settings - CodeSync',
  description: 'Manage your notification preferences',
};

export default function NotificationSettingsPage() {
  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <NotificationSettings />
    </div>
  );
}
