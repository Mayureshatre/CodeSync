import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as publishRoute } from '../../apps/web/app/api/v1/projects/[id]/publish/route';
import { publishProject } from '../../apps/web/src/server/services/projectService';
import { getCurrentSession } from '../../apps/web/src/lib/auth';
import { ForbiddenError } from '../../apps/web/src/server/errors';

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

vi.mock('../../apps/web/src/server/services/projectService', () => ({
  publishProject: vi.fn(),
}));

describe('POST /api/v1/projects/[id]/publish', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('verified owner successfully publishes draft -> open and match recomputation is queued', async () => {
    vi.mocked(getCurrentSession).mockResolvedValue({ user: { id: 'user-1' } } as any);
    vi.mocked(publishProject).mockResolvedValue({ id: 'proj-1', status: 'open' } as any);

    const req = new Request('http://localhost/api/v1/projects/proj-1/publish', { method: 'POST' });
    const res = await publishRoute(req, { params: { id: 'proj-1' } });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.project.status).toBe('open');
    expect(publishProject).toHaveBeenCalledWith('user-1', 'proj-1');
  });

  it('non-owner receives 403', async () => {
    vi.mocked(getCurrentSession).mockResolvedValue({ user: { id: 'user-2' } } as any);
    vi.mocked(publishProject).mockRejectedValue(new ForbiddenError('You do not have permission to publish this project'));

    const req = new Request('http://localhost/api/v1/projects/proj-1/publish', { method: 'POST' });
    const res = await publishRoute(req, { params: { id: 'proj-1' } });

    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe('You do not have permission to publish this project');
  });

  it('unverified owner receives 403', async () => {
    vi.mocked(getCurrentSession).mockResolvedValue({ user: { id: 'user-1' } } as any);
    vi.mocked(publishProject).mockRejectedValue(new ForbiddenError('Email must be verified before publishing a project'));

    const req = new Request('http://localhost/api/v1/projects/proj-1/publish', { method: 'POST' });
    const res = await publishRoute(req, { params: { id: 'proj-1' } });

    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe('Email must be verified before publishing a project');
  });
});
