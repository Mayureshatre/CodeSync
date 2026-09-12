import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../../apps/web/app/api/v1/conversations/route';
import { createConversation } from '../../apps/web/src/server/services/messagingService';
import { getCurrentSession } from '../../apps/web/src/lib/auth';
import { ForbiddenError } from '../../apps/web/src/server/errors';

vi.mock('next/server', () => {
  return {
    NextResponse: {
      json: vi.fn().mockImplementation((body, init) => {
        return {
          status: init?.status || 200,
          json: async () => body
        };
      })
    }
  };
});

const createRequest = (url: string, method = 'GET', body?: any) => {
  return {
    url: `http://localhost:3000${url}`,
    method,
    json: async () => body,
  } as any;
};

vi.mock('../../apps/web/src/lib/auth', () => ({
  getCurrentSession: vi.fn()
}));

vi.mock('../../apps/web/src/server/services/messagingService', () => ({
  createConversation: vi.fn(),
  getUserConversations: vi.fn()
}));

describe('Conversations API (POST /api/v1/conversations)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated requests', async () => {
    vi.mocked(getCurrentSession).mockResolvedValueOnce(null);

    const req = createRequest('/api/v1/conversations', 'POST', { targetUserId: 'user-2' });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('rejects when neither targetUserId nor projectId is provided', async () => {
    vi.mocked(getCurrentSession).mockResolvedValueOnce({ user: { id: 'user-1' } } as any);

    const req = createRequest('/api/v1/conversations', 'POST', {});

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Must specify/);
  });

  it('handles ForbiddenError gracefully (authorization error path)', async () => {
    vi.mocked(getCurrentSession).mockResolvedValueOnce({ user: { id: 'user-1' } } as any);
    
    // Simulate user trying to create project chat they are not in
    vi.mocked(createConversation).mockRejectedValueOnce(new ForbiddenError('Only active members'));

    const req = createRequest('/api/v1/conversations', 'POST', { projectId: 'proj-1' });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toMatch(/Only active members/);
  });

  it('successfully routes valid creation to service', async () => {
    vi.mocked(getCurrentSession).mockResolvedValueOnce({ user: { id: 'user-1' } } as any);
    vi.mocked(createConversation).mockResolvedValueOnce({ id: 'conv-1', type: 'dm' } as any);

    const req = createRequest('/api/v1/conversations', 'POST', { targetUserId: 'user-2' });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.id).toBe('conv-1');
  });
});
