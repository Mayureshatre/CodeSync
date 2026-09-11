// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationList } from '../../../apps/web/src/components/notifications/NotificationList';
import { NotificationSettings } from '../../../apps/web/src/components/notifications/NotificationSettings';
import * as hooks from '../../../apps/web/src/hooks/useNotifications';
import '@testing-library/jest-dom';

vi.mock('../../../apps/web/src/hooks/useNotifications', () => ({
  useNotifications: vi.fn(),
  useMarkNotificationRead: vi.fn(),
  useMarkAllNotificationsRead: vi.fn(),
  useNotificationPreferences: vi.fn(),
  useUpdateNotificationPreference: vi.fn(),
}));

describe('Notifications UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('NotificationList', () => {
    it('renders loading state', () => {
      vi.mocked(hooks.useNotifications).mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        hasNextPage: false,
        isFetchingNextPage: false,
        fetchNextPage: vi.fn()
      } as any);
      vi.mocked(hooks.useMarkNotificationRead).mockReturnValue({ mutate: vi.fn() } as any);
      vi.mocked(hooks.useMarkAllNotificationsRead).mockReturnValue({ mutate: vi.fn() } as any);

      render(<NotificationList />);
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('renders empty state', () => {
      vi.mocked(hooks.useNotifications).mockReturnValue({
        data: { pages: [] },
        isLoading: false,
        isError: false,
        hasNextPage: false,
        isFetchingNextPage: false,
        fetchNextPage: vi.fn()
      } as any);
      vi.mocked(hooks.useMarkNotificationRead).mockReturnValue({ mutate: vi.fn() } as any);
      vi.mocked(hooks.useMarkAllNotificationsRead).mockReturnValue({ mutate: vi.fn() } as any);

      render(<NotificationList />);
      expect(screen.getByText('You have no notifications')).toBeInTheDocument();
    });

    it('renders notifications with correct unread state and navigation links', () => {
      const mockMarkRead = vi.fn();
      vi.mocked(hooks.useMarkNotificationRead).mockReturnValue({ mutate: mockMarkRead } as any);
      vi.mocked(hooks.useMarkAllNotificationsRead).mockReturnValue({ mutate: vi.fn() } as any);

      vi.mocked(hooks.useNotifications).mockReturnValue({
        data: {
          pages: [
            {
              data: [
                {
                  id: 'n1',
                  type: 'PROJECT_ACTIVITY',
                  payload: { event: 'project_updated', projectId: 'p1' },
                  readAt: null, // unread
                  createdAt: new Date().toISOString()
                },
                {
                  id: 'n2',
                  type: 'APPLICATION',
                  payload: { event: 'application_submitted', projectId: 'p2' },
                  readAt: new Date().toISOString(), // read
                  createdAt: new Date().toISOString()
                },
                {
                  id: 'n3',
                  type: 'INVITATION',
                  payload: { event: 'invitation_received' }, // No project ID gracefully falls back to #
                  readAt: null, // unread
                  createdAt: new Date().toISOString()
                }
              ],
              unreadCount: 2
            }
          ]
        },
        isLoading: false,
        isError: false,
        hasNextPage: false,
        isFetchingNextPage: false,
        fetchNextPage: vi.fn()
      } as any);

      render(<NotificationList />);

      expect(screen.getByText('2 new')).toBeInTheDocument();
      expect(screen.getByText('A project you are a part of was updated.')).toBeInTheDocument();
      expect(screen.getByText('A new application was submitted to your project.')).toBeInTheDocument();
      expect(screen.getByText('You received a new project invitation.')).toBeInTheDocument();

      // Check navigation mapping
      const p1Link = screen.getByRole('link', { name: /A project you are a part of was updated/i });
      expect(p1Link.getAttribute('href')).toBe('/projects/p1');
      
      const p2Link = screen.getByRole('link', { name: /A new application was submitted/i });
      expect(p2Link.getAttribute('href')).toBe('/projects/p2');

      const p3Link = screen.getByRole('link', { name: /You received a new project invitation/i });
      expect(p3Link.getAttribute('href')).toBe('#');

      // Click unread notification should mark it as read
      fireEvent.click(p1Link);
      expect(mockMarkRead).toHaveBeenCalledWith('n1');
      
      // Click read notification should not mark it as read again
      mockMarkRead.mockClear();
      fireEvent.click(p2Link);
      expect(mockMarkRead).not.toHaveBeenCalled();
    });

    it('triggers markAllRead when clicked', () => {
      const mockMarkAllRead = vi.fn();
      vi.mocked(hooks.useMarkAllNotificationsRead).mockReturnValue({ mutate: mockMarkAllRead, isPending: false } as any);
      vi.mocked(hooks.useMarkNotificationRead).mockReturnValue({ mutate: vi.fn() } as any);
      vi.mocked(hooks.useNotifications).mockReturnValue({
        data: {
          pages: [
            {
              data: [
                {
                  id: 'n1',
                  type: 'SYSTEM',
                  payload: {},
                  readAt: null,
                  createdAt: new Date().toISOString()
                }
              ],
              unreadCount: 1
            }
          ]
        },
        isLoading: false,
        isError: false,
        hasNextPage: false,
        isFetchingNextPage: false,
        fetchNextPage: vi.fn()
      } as any);

      render(<NotificationList />);
      const markAllBtn = screen.getByText('Mark all as read');
      fireEvent.click(markAllBtn);
      expect(mockMarkAllRead).toHaveBeenCalled();
    });
  });

  describe('NotificationSettings', () => {
    it('renders preferences and toggles them independently', () => {
      const mockUpdate = vi.fn();
      vi.mocked(hooks.useUpdateNotificationPreference).mockReturnValue({ mutate: mockUpdate } as any);
      
      vi.mocked(hooks.useNotificationPreferences).mockReturnValue({
        data: {
          PROJECT_MATCH: { IN_APP: true, EMAIL: false },
          APPLICATION: { IN_APP: true, EMAIL: true },
          INVITATION: { IN_APP: true, EMAIL: true },
          MESSAGE: { IN_APP: true, EMAIL: true },
          PROJECT_ACTIVITY: { IN_APP: true, EMAIL: true },
          PLATFORM_UPDATE: { IN_APP: true, EMAIL: true },
          SYSTEM: { IN_APP: true, EMAIL: true },
        },
        isLoading: false,
        isError: false,
      } as any);

      render(<NotificationSettings />);
      
      expect(screen.getByText('Notification Preferences')).toBeInTheDocument();
      expect(screen.getByText('Project Matches')).toBeInTheDocument();

      // Find the toggle buttons for PROJECT_MATCH. 
      // The first switch in the row is IN_APP (checked), the second is EMAIL (unchecked).
      const switches = screen.getAllByRole('switch');
      expect(switches[0]).toHaveAttribute('aria-checked', 'true');
      expect(switches[1]).toHaveAttribute('aria-checked', 'false');

      // Toggle IN_APP to false
      fireEvent.click(switches[0]);
      expect(mockUpdate).toHaveBeenCalledWith({
        category: 'PROJECT_MATCH',
        channel: 'IN_APP',
        enabled: false
      });

      // Toggle EMAIL to true
      mockUpdate.mockClear();
      fireEvent.click(switches[1]);
      expect(mockUpdate).toHaveBeenCalledWith({
        category: 'PROJECT_MATCH',
        channel: 'EMAIL',
        enabled: true
      });
    });
  });
});
