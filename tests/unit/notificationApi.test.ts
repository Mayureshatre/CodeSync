import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getNotificationsHandler } from '../../apps/web/app/api/v1/notifications/route';
import { POST as readAllHandler } from '../../apps/web/app/api/v1/notifications/read-all/route';
import { PUT as readSingleHandler } from '../../apps/web/app/api/v1/notifications/[id]/read/route';
import { GET as getPreferencesHandler, PUT as updatePreferenceHandler } from '../../apps/web/app/api/v1/notifications/preferences/route';
import { getCurrentSession } from '../../apps/web/src/lib/auth';
import { 
  getNotifications, 
  getUnreadCount, 
  markAllAsRead, 
  markAsRead, 
  getPreferences, 
  updatePreference 
} from '../../apps/web/src/server/services/notificationService';
import { ForbiddenError, NotFoundError } from '../../apps/web/src/server/errors';

vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn().mockImplementation((body, init) => {
      return {
        status: init?.status || 200,
        json: async () => body,
      };
    }),
  },
}));

vi.mock('../../apps/web/src/lib/auth', () => ({
  getCurrentSession: vi.fn(),
}));

vi.mock('../../apps/web/src/server/services/notificationService', () => ({
  getNotifications: vi.fn(),
  getUnreadCount: vi.fn(),
  markAllAsRead: vi.fn(),
  markAsRead: vi.fn(),
  getPreferences: vi.fn(),
  updatePreference: vi.fn(),
}));

const createRequest = (url: string, method = 'GET', body?: any) => {
  return {
    url: `http://localhost:3000${url}`,
    method,
    json: async () => body,
  } as any;
};

describe('Notification API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/notifications', () => {
    it('returns 401 when unauthenticated', async () => {
      vi.mocked(getCurrentSession).mockResolvedValueOnce(null);
      const req = createRequest('/api/v1/notifications');
      const res = await getNotificationsHandler(req);
      expect(res.status).toBe(401);
    });

    it('returns notifications and unread count for authenticated user', async () => {
      vi.mocked(getCurrentSession).mockResolvedValueOnce({ user: { id: 'user-1' } } as any);
      vi.mocked(getNotifications).mockResolvedValueOnce({ items: [{ id: '1' }] as any, nextCursor: '2' });
      vi.mocked(getUnreadCount).mockResolvedValueOnce(5);

      const req = createRequest('/api/v1/notifications?limit=10&cursor=abc');
      const res = await getNotificationsHandler(req);
      
      expect(res.status).toBe(200);
      expect(getNotifications).toHaveBeenCalledWith('user-1', 'abc', 10);
      const json = await res.json();
      expect(json).toEqual({
        data: [{ id: '1' }],
        nextCursor: '2',
        unreadCount: 5
      });
    });

    it('returns 400 for invalid query limit', async () => {
      vi.mocked(getCurrentSession).mockResolvedValueOnce({ user: { id: 'user-1' } } as any);
      const req = createRequest('/api/v1/notifications?limit=200'); // max 100
      const res = await getNotificationsHandler(req);
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/notifications/read-all', () => {
    it('returns 401 when unauthenticated', async () => {
      vi.mocked(getCurrentSession).mockResolvedValueOnce(null);
      const req = createRequest('/api/v1/notifications/read-all', 'POST');
      const res = await readAllHandler(req);
      expect(res.status).toBe(401);
    });

    it('marks all as read and returns success', async () => {
      vi.mocked(getCurrentSession).mockResolvedValueOnce({ user: { id: 'user-1' } } as any);
      vi.mocked(markAllAsRead).mockResolvedValueOnce({ count: 3 } as any);

      const req = createRequest('/api/v1/notifications/read-all', 'POST');
      const res = await readAllHandler(req);
      
      expect(res.status).toBe(200);
      expect(markAllAsRead).toHaveBeenCalledWith('user-1');
      const json = await res.json();
      expect(json).toEqual({ success: true, count: 3 });
    });
  });

  describe('PUT /api/v1/notifications/[id]/read', () => {
    it('returns 401 when unauthenticated', async () => {
      vi.mocked(getCurrentSession).mockResolvedValueOnce(null);
      const req = createRequest('/api/v1/notifications/123/read', 'PUT');
      const res = await readSingleHandler(req, { params: { id: '123' } });
      expect(res.status).toBe(401);
    });

    it('marks a specific notification as read', async () => {
      vi.mocked(getCurrentSession).mockResolvedValueOnce({ user: { id: 'user-1' } } as any);
      vi.mocked(markAsRead).mockResolvedValueOnce({ id: '123' } as any);

      const req = createRequest('/api/v1/notifications/123/read', 'PUT');
      const res = await readSingleHandler(req, { params: { id: '123' } });
      
      expect(res.status).toBe(200);
      expect(markAsRead).toHaveBeenCalledWith('user-1', '123');
    });

    it('returns 403 on ForbiddenError', async () => {
      vi.mocked(getCurrentSession).mockResolvedValueOnce({ user: { id: 'user-1' } } as any);
      vi.mocked(markAsRead).mockRejectedValueOnce(new ForbiddenError('Forbidden'));

      const req = createRequest('/api/v1/notifications/123/read', 'PUT');
      const res = await readSingleHandler(req, { params: { id: '123' } });
      expect(res.status).toBe(403);
    });

    it('returns 404 on NotFoundError', async () => {
      vi.mocked(getCurrentSession).mockResolvedValueOnce({ user: { id: 'user-1' } } as any);
      vi.mocked(markAsRead).mockRejectedValueOnce(new NotFoundError('Not found'));

      const req = createRequest('/api/v1/notifications/123/read', 'PUT');
      const res = await readSingleHandler(req, { params: { id: '123' } });
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/v1/notifications/preferences', () => {
    it('returns 401 when unauthenticated', async () => {
      vi.mocked(getCurrentSession).mockResolvedValueOnce(null);
      const req = createRequest('/api/v1/notifications/preferences');
      const res = await getPreferencesHandler(req);
      expect(res.status).toBe(401);
    });

    it('returns preferences for the authenticated user', async () => {
      vi.mocked(getCurrentSession).mockResolvedValueOnce({ user: { id: 'user-1' } } as any);
      const mockPrefs = { PROJECT_MATCH: { EMAIL: true, IN_APP: true } };
      vi.mocked(getPreferences).mockResolvedValueOnce(mockPrefs as any);

      const req = createRequest('/api/v1/notifications/preferences');
      const res = await getPreferencesHandler(req);
      
      expect(res.status).toBe(200);
      expect(getPreferences).toHaveBeenCalledWith('user-1');
      const json = await res.json();
      expect(json.data).toEqual(mockPrefs);
    });
  });

  describe('PUT /api/v1/notifications/preferences', () => {
    it('returns 401 when unauthenticated', async () => {
      vi.mocked(getCurrentSession).mockResolvedValueOnce(null);
      const req = createRequest('/api/v1/notifications/preferences', 'PUT', { category: 'MESSAGE', channel: 'EMAIL', enabled: false });
      const res = await updatePreferenceHandler(req);
      expect(res.status).toBe(401);
    });

    it('returns 400 for invalid input', async () => {
      vi.mocked(getCurrentSession).mockResolvedValueOnce({ user: { id: 'user-1' } } as any);
      const req = createRequest('/api/v1/notifications/preferences', 'PUT', { category: 'INVALID', channel: 'EMAIL', enabled: false });
      const res = await updatePreferenceHandler(req);
      expect(res.status).toBe(400);
    });

    it('updates preference for valid input', async () => {
      vi.mocked(getCurrentSession).mockResolvedValueOnce({ user: { id: 'user-1' } } as any);
      vi.mocked(updatePreference).mockResolvedValueOnce({ enabled: false } as any);

      const req = createRequest('/api/v1/notifications/preferences', 'PUT', { category: 'MESSAGE', channel: 'EMAIL', enabled: false });
      const res = await updatePreferenceHandler(req);
      
      expect(res.status).toBe(200);
      expect(updatePreference).toHaveBeenCalledWith('user-1', 'MESSAGE', 'EMAIL', false);
    });
  });
});
