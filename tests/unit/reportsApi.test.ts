import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../../apps/web/app/api/v1/reports/route';

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

vi.mock('../../apps/web/src/server/services/moderationService', () => ({
  createReport: vi.fn(),
}));

import { getCurrentSession } from '../../apps/web/src/lib/auth';
import { createReport } from '../../apps/web/src/server/services/moderationService';
import { ForbiddenError, NotFoundError, ConflictError } from '../../apps/web/src/server/errors';

describe('POST /api/v1/reports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 if unauthenticated', async () => {
    vi.mocked(getCurrentSession).mockResolvedValue(null as any);

    const req = new Request('http://localhost:3000/api/v1/reports', {
      method: 'POST',
      body: JSON.stringify({
        targetType: 'user',
        targetId: 'user_target',
        reason: 'spam',
      }),
    }) as any;

    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 400 on invalid input payload', async () => {
    vi.mocked(getCurrentSession).mockResolvedValue({
      user: { id: 'user_1' },
    } as any);

    const req = new Request('http://localhost:3000/api/v1/reports', {
      method: 'POST',
      body: JSON.stringify({
        targetType: 'invalid_type',
        targetId: 'user_target',
        reason: 'spam',
      }),
    }) as any;

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 403 when service throws ForbiddenError', async () => {
    vi.mocked(getCurrentSession).mockResolvedValue({
      user: { id: 'user_1' },
    } as any);
    vi.mocked(createReport).mockRejectedValue(new ForbiddenError('Cannot report yourself'));

    const req = new Request('http://localhost:3000/api/v1/reports', {
      method: 'POST',
      body: JSON.stringify({
        targetType: 'user',
        targetId: 'user_1',
        reason: 'spam',
      }),
    }) as any;

    const res = await POST(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.message).toBe('Cannot report yourself');
  });

  it('returns 404 when service throws NotFoundError', async () => {
    vi.mocked(getCurrentSession).mockResolvedValue({
      user: { id: 'user_1' },
    } as any);
    vi.mocked(createReport).mockRejectedValue(new NotFoundError('Target user not found'));

    const req = new Request('http://localhost:3000/api/v1/reports', {
      method: 'POST',
      body: JSON.stringify({
        targetType: 'user',
        targetId: 'non_existent',
        reason: 'spam',
      }),
    }) as any;

    const res = await POST(req);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.message).toBe('Target user not found');
  });

  it('returns 409 when service throws ConflictError', async () => {
    vi.mocked(getCurrentSession).mockResolvedValue({
      user: { id: 'user_1' },
    } as any);
    vi.mocked(createReport).mockRejectedValue(new ConflictError('You already have an open report for this item'));

    const req = new Request('http://localhost:3000/api/v1/reports', {
      method: 'POST',
      body: JSON.stringify({
        targetType: 'user',
        targetId: 'user_2',
        reason: 'spam',
      }),
    }) as any;

    const res = await POST(req);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error.message).toBe('You already have an open report for this item');
  });

  it('returns 201 on successful report creation', async () => {
    const mockReport = {
      id: 'rep_1',
      reporterId: 'user_1',
      targetType: 'user',
      targetId: 'user_2',
      reason: 'spam: Looks like spam',
      status: 'open',
      createdAt: new Date(),
    };
    vi.mocked(getCurrentSession).mockResolvedValue({
      user: { id: 'user_1' },
    } as any);
    vi.mocked(createReport).mockResolvedValue(mockReport as any);

    const req = new Request('http://localhost:3000/api/v1/reports', {
      method: 'POST',
      body: JSON.stringify({
        targetType: 'user',
        targetId: 'user_2',
        reason: 'spam',
        description: 'Looks like spam',
      }),
    }) as any;

    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.id).toBe('rep_1');
    expect(createReport).toHaveBeenCalledWith('user_1', {
      targetType: 'user',
      targetId: 'user_2',
      reason: 'spam',
      description: 'Looks like spam',
    });
  });
});
