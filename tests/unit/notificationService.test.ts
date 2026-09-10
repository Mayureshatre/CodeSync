import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  createNotification, 
  getNotifications, 
  markAsRead, 
  markAllAsRead, 
  getPreferences, 
  updatePreference, 
  getUnreadCount 
} from '../../apps/web/src/server/services/notificationService';
import { prisma } from '../../apps/web/src/server/db';
import { NotFoundError, ForbiddenError } from '../../apps/web/src/server/errors';
import { DEFAULT_PREFERENCES } from '../../apps/web/src/lib/validations/notification';

vi.mock('../../apps/web/src/server/db', () => ({
  prisma: {
    notification: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
    notificationPreference: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    }
  }
}));

describe('notificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createNotification', () => {
    it('creates a notification with the provided data', async () => {
      const mockResult = { id: 'notif-1', userId: 'user-1', type: 'PROJECT_MATCH', payload: { projectId: 'p1' } };
      vi.mocked(prisma.notification.create).mockResolvedValueOnce(mockResult as any);

      const res = await createNotification('user-1', 'PROJECT_MATCH', { projectId: 'p1' });

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          type: 'PROJECT_MATCH',
          payload: { projectId: 'p1' }
        }
      });
      expect(res).toEqual(mockResult);
    });
  });

  describe('getNotifications', () => {
    it('returns paginated notifications and next cursor', async () => {
      const mockNotifs = [
        { id: 'notif-2' },
        { id: 'notif-1' }
      ];
      // mock returning limit + 1 items
      vi.mocked(prisma.notification.findMany).mockResolvedValueOnce([
        ...mockNotifs,
        { id: 'notif-old' } // The limit+1 item
      ] as any);

      const res = await getNotifications('user-1', undefined, 2);

      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        take: 3,
        cursor: undefined,
        orderBy: { createdAt: 'desc' }
      });
      
      expect(res.items).toHaveLength(2);
      expect(res.nextCursor).toBe('notif-old');
    });
  });

  describe('markAsRead', () => {
    it('marks a specific notification as read if user is owner', async () => {
      vi.mocked(prisma.notification.findUnique).mockResolvedValueOnce({
        id: 'notif-1',
        userId: 'user-1',
        readAt: null
      } as any);
      vi.mocked(prisma.notification.update).mockResolvedValueOnce({} as any);

      await markAsRead('user-1', 'notif-1');

      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
        data: { readAt: expect.any(Date) }
      });
    });

    it('throws ForbiddenError if user is not the owner', async () => {
      vi.mocked(prisma.notification.findUnique).mockResolvedValueOnce({
        id: 'notif-1',
        userId: 'other-user',
        readAt: null
      } as any);

      await expect(markAsRead('user-1', 'notif-1')).rejects.toThrow(ForbiddenError);
    });
    
    it('throws NotFoundError if notification does not exist', async () => {
      vi.mocked(prisma.notification.findUnique).mockResolvedValueOnce(null);
      await expect(markAsRead('user-1', 'notif-1')).rejects.toThrow(NotFoundError);
    });
  });

  describe('markAllAsRead', () => {
    it('marks all unread notifications for a user as read', async () => {
      vi.mocked(prisma.notification.updateMany).mockResolvedValueOnce({ count: 5 } as any);

      await markAllAsRead('user-1');

      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', readAt: null },
        data: { readAt: expect.any(Date) }
      });
    });
  });

  describe('getPreferences', () => {
    it('returns default preferences when user has no explicit preferences', async () => {
      vi.mocked(prisma.notificationPreference.findMany).mockResolvedValueOnce([]);

      const prefs = await getPreferences('user-1');
      expect(prefs).toEqual(DEFAULT_PREFERENCES);
    });

    it('overrides defaults with user-saved preferences', async () => {
      vi.mocked(prisma.notificationPreference.findMany).mockResolvedValueOnce([
        { userId: 'user-1', category: 'APPLICATION', channel: 'EMAIL', enabled: false }
      ] as any);

      const prefs = await getPreferences('user-1');
      
      expect(prefs['APPLICATION']['EMAIL']).toBe(false); // Overridden
      expect(prefs['APPLICATION']['IN_APP']).toBe(true); // Default remains
      expect(prefs['PROJECT_MATCH']['EMAIL']).toBe(true); // Default remains
    });
  });

  describe('updatePreference', () => {
    it('upserts the preference correctly', async () => {
      vi.mocked(prisma.notificationPreference.upsert).mockResolvedValueOnce({} as any);

      await updatePreference('user-1', 'MESSAGE', 'EMAIL', false);

      expect(prisma.notificationPreference.upsert).toHaveBeenCalledWith({
        where: {
          userId_category_channel: {
            userId: 'user-1',
            category: 'MESSAGE',
            channel: 'EMAIL'
          }
        },
        update: { enabled: false },
        create: {
          userId: 'user-1',
          category: 'MESSAGE',
          channel: 'EMAIL',
          enabled: false
        }
      });
    });
  });
  
  describe('getUnreadCount', () => {
    it('counts unread notifications', async () => {
      vi.mocked(prisma.notification.count).mockResolvedValueOnce(3);
      const count = await getUnreadCount('user-1');
      expect(count).toBe(3);
      expect(prisma.notification.count).toHaveBeenCalledWith({
        where: { userId: 'user-1', readAt: null }
      });
    });
  });
});
