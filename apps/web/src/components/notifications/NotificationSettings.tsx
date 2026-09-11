'use client';

import React from 'react';
import { useNotificationPreferences, useUpdateNotificationPreference } from '../../hooks/useNotifications';
import { NotificationCategory, NotificationChannel } from '../../lib/validations/notification';
import { Loader2Icon } from 'lucide-react';

const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  PROJECT_MATCH: 'Project Matches',
  APPLICATION: 'Applications',
  INVITATION: 'Invitations',
  MESSAGE: 'Messages',
  PROJECT_ACTIVITY: 'Project Activity',
  PLATFORM_UPDATE: 'Platform Updates',
  SYSTEM: 'System Alerts'
};

const CATEGORY_DESCRIPTIONS: Record<NotificationCategory, string> = {
  PROJECT_MATCH: 'When you receive a new high-quality match for your skills.',
  APPLICATION: 'Updates on applications you sent or received.',
  INVITATION: 'When someone invites you to collaborate.',
  MESSAGE: 'New direct or project messages.',
  PROJECT_ACTIVITY: 'Activity in projects you are a part of.',
  PLATFORM_UPDATE: 'New features and improvements to CodeSync.',
  SYSTEM: 'Important system and security alerts.'
};

export function NotificationSettings() {
  const { data: preferences, isLoading, isError } = useNotificationPreferences();
  const { mutate: updatePreference } = useUpdateNotificationPreference();

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2Icon className="w-8 h-8 text-[#06b6d4] animate-spin" />
      </div>
    );
  }

  if (isError || !preferences) {
    return (
      <div className="p-8 text-center text-red-500">
        Failed to load preferences. Please try again.
      </div>
    );
  }

  const handleToggle = (category: NotificationCategory, channel: NotificationChannel, currentEnabled: boolean) => {
    updatePreference({ category, channel, enabled: !currentEnabled });
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Notification Preferences</h1>
        <p className="text-[#94a3b8]">Choose how you want to be notified about activity on CodeSync.</p>
      </div>

      <div className="bg-[#181c24] rounded-[12px] border border-[#263042] overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-[#263042] bg-[#1e2433]/50 text-sm font-bold text-[#94a3b8]">
          <div className="col-span-8">Category</div>
          <div className="col-span-2 text-center">In-App</div>
          <div className="col-span-2 text-center">Email</div>
        </div>

        <div className="divide-y divide-[#263042]">
          {(Object.keys(CATEGORY_LABELS) as NotificationCategory[]).map((category) => {
            const inAppEnabled = preferences[category]?.IN_APP ?? true;
            const emailEnabled = preferences[category]?.EMAIL ?? true;

            return (
              <div key={category} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-[#1e2433]/30 transition-colors">
                <div className="col-span-8">
                  <p className="text-white font-medium">{CATEGORY_LABELS[category]}</p>
                  <p className="text-[#94a3b8] text-sm mt-1">{CATEGORY_DESCRIPTIONS[category]}</p>
                </div>
                
                <div className="col-span-2 flex justify-center">
                  <button
                    role="switch"
                    aria-checked={inAppEnabled}
                    onClick={() => handleToggle(category, 'IN_APP', inAppEnabled)}
                    className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${
                      inAppEnabled ? 'bg-[#06b6d4]' : 'bg-[#263042]'
                    }`}
                  >
                    <span 
                      className={`block w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${
                        inAppEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`} 
                    />
                  </button>
                </div>

                <div className="col-span-2 flex justify-center">
                  <button
                    role="switch"
                    aria-checked={emailEnabled}
                    onClick={() => handleToggle(category, 'EMAIL', emailEnabled)}
                    className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${
                      emailEnabled ? 'bg-[#06b6d4]' : 'bg-[#263042]'
                    }`}
                  >
                    <span 
                      className={`block w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${
                        emailEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`} 
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
