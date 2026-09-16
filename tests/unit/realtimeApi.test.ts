import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../../apps/web/app/api/v1/realtime/auth/route';
import { authorizeRealtimeChannel } from '../../apps/web/src/server/services/realtimeService';
import { getCurrentSession } from '../../apps/web/src/lib/auth';
import { ForbiddenError, ValidationError } from '../../apps/web/src/server/errors';

vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn().mockImplementation((body, init) => {
      return {
        status: init?.status || 200,
        json: async () => body
      };
    })
  }
}));

vi.mock('../../apps/web/src/lib/auth', () => ({
  getCurrentSession: vi.fn()
}));

vi.mock('../../apps/web/src/server/services/realtimeService', () => ({
  authorizeRealtimeChannel: vi.fn()
}));

const createRequest = (body: any) => {
  return {
    json: async () => body
  } as any;
};

describe('Realtime Auth API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated requests', async () => {
    vi.mocked(getCurrentSession).mockResolvedValue(null);
    
    const req = createRequest({ channelName: 'private-conversation-123' });
    const res = await POST(req) as any;
    
    expect(res.status).toBe(401);
  });

  it('rejects missing or invalid channelName', async () => {
    vi.mocked(getCurrentSession).mockResolvedValue({ user: { id: 'user-1' } } as any);
    
    const req = createRequest({ wrongField: 'xyz' });
    const res = await POST(req) as any;
    
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid request data');
  });

  it('returns 400 for ValidationError from service', async () => {
    vi.mocked(getCurrentSession).mockResolvedValue({ user: { id: 'user-1' } } as any);
    vi.mocked(authorizeRealtimeChannel).mockRejectedValue(new ValidationError('Unsupported channel type'));
    
    const req = createRequest({ channelName: 'public-room-1' });
    const res = await POST(req) as any;
    
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Unsupported channel type');
  });

  it('returns 403 for ForbiddenError from service', async () => {
    vi.mocked(getCurrentSession).mockResolvedValue({ user: { id: 'user-1' } } as any);
    vi.mocked(authorizeRealtimeChannel).mockRejectedValue(new ForbiddenError('Not authorized'));
    
    const req = createRequest({ channelName: 'private-conversation-999' });
    const res = await POST(req) as any;
    
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Not authorized');
  });

  it('returns token request on success', async () => {
    vi.mocked(getCurrentSession).mockResolvedValue({ user: { id: 'user-1' } } as any);
    const mockTokenRequest = { keyName: 'xyz', capability: '...', nonce: '123' };
    vi.mocked(authorizeRealtimeChannel).mockResolvedValue(mockTokenRequest as any);
    
    const req = createRequest({ channelName: 'private-conversation-123' });
    const res = await POST(req) as any;
    
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(mockTokenRequest);
    expect(authorizeRealtimeChannel).toHaveBeenCalledWith('user-1', 'private-conversation-123');
  });
});
