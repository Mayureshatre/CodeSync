'use client';

import React from 'react';
import { useNotificationPreferences, useUpdateNotificationPreference } from '../../hooks/useNotifications';
import { NotificationCategory, NotificationChannel } from '../../lib/validations/notification';
import { Loader2Icon, MailIcon, SmartphoneIcon } from 'lucide-react';

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
      <div className="flex justify-center p-12">
        <Loader2Icon className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (isError || !preferences) {
    return (
      <div className="p-8 text-center bg-error/5 border border-error/20 text-error rounded-2xl max-w-2xl mx-auto">
        <p className="font-medium">Failed to load preferences. Please try again.</p>
      </div>
    );
  }

  const handleToggle = (category: NotificationCategory, channel: NotificationChannel, currentEnabled: boolean) => {
    updatePreference({ category, channel, enabled: !currentEnabled });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary mb-2">Notification Preferences</h1>
        <p className="text-secondary text-sm">Choose how you want to be notified about activity on CodeSync.</p>
      </div>

      <div className="bg-surface rounded-2xl border border-border shadow-elevation-flat overflow-hidden">
        {/* Table Header */}
        <div className="hidden sm:grid grid-cols-12 gap-4 p-5 border-b border-border bg-surface-elevated/50 text-xs font-bold uppercase tracking-wider text-muted">
          <div className="col-span-8">Notification Type</div>
          <div className="col-span-2 flex justify-center items-center gap-1.5"><SmartphoneIcon className="w-4 h-4" /> In-App</div>
          <div className="col-span-2 flex justify-center items-center gap-1.5"><MailIcon className="w-4 h-4" /> Email</div>
        </div>

        <div className="divide-y divide-border">
          {(Object.keys(CATEGORY_LABELS) as NotificationCategory[]).map((category) => {
            const inAppEnabled = preferences[category]?.IN_APP ?? true;
            const emailEnabled = preferences[category]?.EMAIL ?? true;

            return (
              <div key={category} className="flex flex-col sm:grid sm:grid-cols-12 gap-4 p-5 items-start sm:items-center hover:bg-surface-elevated/20 transition-colors">
                <div className="col-span-8">
                  <p className="text-primary font-bold text-sm">{CATEGORY_LABELS[category]}</p>
                  <p className="text-secondary text-sm mt-1">{CATEGORY_DESCRIPTIONS[category]}</p>
                </div>
                
                <div className="flex w-full sm:w-auto justify-between sm:justify-center sm:col-span-4 mt-4 sm:mt-0 pt-4 sm:pt-0 border-t border-border sm:border-0">
                  {/* Mobile labels */}
                  <div className="flex flex-col gap-4 w-full sm:grid sm:grid-cols-2 sm:w-full">
                    <div className="flex justify-between items-center sm:justify-center">
                      <span className="sm:hidden text-sm font-medium text-secondary flex items-center gap-2"><SmartphoneIcon className="w-4 h-4" /> In-App</span>
                      <button
                        role="switch"
                        aria-checked={inAppEnabled}
                        onClick={() => handleToggle(category, 'IN_APP', inAppEnabled)}
                        className={`w-12 h-6 rounded-full transition-all relative flex items-center shadow-elevation-low border ${
                          inAppEnabled ? 'bg-accent border-accent' : 'bg-surface-elevated border-border hover:bg-border/50'
                        }`}
                      >
                        <span 
                          className={`block w-4 h-4 rounded-full transition-transform shadow-sm ${
                            inAppEnabled ? 'translate-x-7 bg-white' : 'translate-x-1 bg-muted'
                          }`} 
                        />
                      </button>
                    </div>

                    <div className="flex justify-between items-center sm:justify-center">
                      <span className="sm:hidden text-sm font-medium text-secondary flex items-center gap-2"><MailIcon className="w-4 h-4" /> Email</span>
                      <button
                        role="switch"
                        aria-checked={emailEnabled}
                        onClick={() => handleToggle(category, 'EMAIL', emailEnabled)}
                        className={`w-12 h-6 rounded-full transition-all relative flex items-center shadow-elevation-low border ${
                          emailEnabled ? 'bg-accent border-accent' : 'bg-surface-elevated border-border hover:bg-border/50'
                        }`}
                      >
                        <span 
                          className={`block w-4 h-4 rounded-full transition-transform shadow-sm ${
                            emailEnabled ? 'translate-x-7 bg-white' : 'translate-x-1 bg-muted'
                          }`} 
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
