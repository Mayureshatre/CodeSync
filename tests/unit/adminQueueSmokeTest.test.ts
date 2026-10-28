import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET } from '../../apps/web/app/api/v1/admin/diagnostics/queue-smoke-test/route';
import { getCurrentSession } from '../../apps/web/src/lib/auth';
import { getMatchingQueue } from '@codesync/core/queue';
import { _resetLastSmokeTestTimestampForTesting } from '../../apps/web/src/server/services/adminService';
import { processMatchingJob } from '../../worker/src/matchingWorker';
import * as matchingService from '@codesync/core/matchingService';

vi.mock('../../apps/web/src/lib/auth', () => ({
  getCurrentSession: vi.fn(),
}));

vi.mock('@codesync/core/queue', () => {
  const mockQueue = {
    add: vi.fn(),
    getJob: vi.fn(),
  };
  return {
    getMatchingQueue: vi.fn(() => mockQueue),
  };
});

vi.mock('@codesync/core/matchingService', () => ({
  recomputeAndPersistMatch: vi.fn().mockResolvedValue(undefined),
  recomputeAllForUser: vi.fn().mockResolvedValue(undefined),
  recomputeAllForProject: vi.fn().mockResolvedValue(undefined),
}));

describe('Admin Diagnostics - Matching Queue Smoke Test Endpoint', () => {
  let mockQueue: any;

  beforeEach(() => {
    vi.clearAllMocks();
    _resetLastSmokeTestTimestampForTesting();
    mockQueue = (getMatchingQueue as any)();
  });

  const createRequest = (url: string, method: string, headers: Record<string, string> = {}, body?: any): Request => {
    return new Request(url, {
      method,
      headers: new Headers({
        host: 'codesync.com',
        origin: 'https://codesync.com',
        ...headers,
      }),
      body: body ? JSON.stringify(body) : undefined,
    });
  };

  describe('POST /api/v1/admin/diagnostics/queue-smoke-test', () => {
    it('returns 401 Unauthorized for unauthenticated requests', async () => {
      vi.mocked(getCurrentSession).mockResolvedValueOnce(null);

      const req = createRequest('https://codesync.com/api/v1/admin/diagnostics/queue-smoke-test', 'POST');
      const res = await POST(req);

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe('Unauthorized');
      expect(mockQueue.add).not.toHaveBeenCalled();
    });

    it('returns 403 Forbidden for non-admin users (e.g. regular user)', async () => {
      vi.mocked(getCurrentSession).mockResolvedValueOnce({
        user: { id: 'u1', role: 'user' },
      } as any);

      const req = createRequest('https://codesync.com/api/v1/admin/diagnostics/queue-smoke-test', 'POST');
      const res = await POST(req);

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toMatch(/Admin privileges required/i);
      expect(mockQueue.add).not.toHaveBeenCalled();
    });

    it('returns 403 Forbidden for moderator users (only admin allowed)', async () => {
      vi.mocked(getCurrentSession).mockResolvedValueOnce({
        user: { id: 'm1', role: 'moderator' },
      } as any);

      const req = createRequest('https://codesync.com/api/v1/admin/diagnostics/queue-smoke-test', 'POST');
      const res = await POST(req);

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toMatch(/Admin privileges required/i);
      expect(mockQueue.add).not.toHaveBeenCalled();
    });

    it('returns 403 Forbidden when origin does not match host (cross-origin CSRF defense)', async () => {
      vi.mocked(getCurrentSession).mockResolvedValueOnce({
        user: { id: 'a1', role: 'admin' },
      } as any);

      const req = createRequest('https://codesync.com/api/v1/admin/diagnostics/queue-smoke-test', 'POST', {
        origin: 'https://malicious-site.com',
        host: 'codesync.com',
      });
      const res = await POST(req);

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toMatch(/cross-origin/i);
      expect(mockQueue.add).not.toHaveBeenCalled();
    });

    it('returns 403 Forbidden when sec-fetch-site is cross-site', async () => {
      vi.mocked(getCurrentSession).mockResolvedValueOnce({
        user: { id: 'a1', role: 'admin' },
      } as any);

      const req = createRequest('https://codesync.com/api/v1/admin/diagnostics/queue-smoke-test', 'POST', {
        'sec-fetch-site': 'cross-site',
      });
      const res = await POST(req);

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toMatch(/cross-origin/i);
      expect(mockQueue.add).not.toHaveBeenCalled();
    });

    it('successfully enqueues an empty-payload job with admin session and ignores request body', async () => {
      vi.mocked(getCurrentSession).mockResolvedValueOnce({
        user: { id: 'a1', role: 'admin' },
      } as any);

      mockQueue.add.mockImplementationOnce(async (name: string, payload: any, opts: any) => ({
        id: opts.jobId,
        name,
        data: payload,
      }));

      // Attacker or client provides custom malicious or unexpected data in body
      const maliciousBody = { userId: 'victim-123', projectId: 'project-999', malicious: true };
      const req = createRequest('https://codesync.com/api/v1/admin/diagnostics/queue-smoke-test', 'POST', {}, maliciousBody);
      const res = await POST(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.queue).toBe('matching');
      expect(json.jobId).toMatch(/^smoke-test-\d+-[a-z0-9]+$/);

      // Verify that queue.add was strictly called with 'recompute' and {}
      expect(mockQueue.add).toHaveBeenCalledWith(
        'recompute',
        {},
        expect.objectContaining({
          jobId: json.jobId,
          attempts: 1,
          removeOnComplete: { age: 300 },
          removeOnFail: { age: 300 },
        })
      );
    });

    it('prevents accidental duplicate submissions with 409 Conflict within debounce window', async () => {
      vi.mocked(getCurrentSession).mockResolvedValue({
        user: { id: 'a1', role: 'admin' },
      } as any);

      mockQueue.add.mockResolvedValue({ id: 'smoke-test-1-abc' });

      // First request succeeds
      const req1 = createRequest('https://codesync.com/api/v1/admin/diagnostics/queue-smoke-test', 'POST');
      const res1 = await POST(req1);
      expect(res1.status).toBe(200);

      // Second immediate request within 5s debounce window fails with 409
      const req2 = createRequest('https://codesync.com/api/v1/admin/diagnostics/queue-smoke-test', 'POST');
      const res2 = await POST(req2);
      expect(res2.status).toBe(409);
      const json2 = await res2.json();
      expect(json2.error).toMatch(/recently/i);
    });

    it('sanitizes Redis secrets if queue operation throws an error', async () => {
      vi.mocked(getCurrentSession).mockResolvedValueOnce({
        user: { id: 'a1', role: 'admin' },
      } as any);

      mockQueue.add.mockRejectedValueOnce(new Error('Connection failed to redis://default:superSecretP@ssword@redis.prod:6379/0'));

      const req = createRequest('https://codesync.com/api/v1/admin/diagnostics/queue-smoke-test', 'POST');
      const res = await POST(req);

      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error).toContain('Queue operation failed');
      expect(json.error).toContain('redis://***@redis.prod:6379/0');
      expect(json.error).not.toContain('superSecretP@ssword');
    });
  });

  describe('GET /api/v1/admin/diagnostics/queue-smoke-test', () => {
    it('returns 401 Unauthorized for unauthenticated requests', async () => {
      vi.mocked(getCurrentSession).mockResolvedValueOnce(null);

      const req = createRequest('https://codesync.com/api/v1/admin/diagnostics/queue-smoke-test?jobId=smoke-test-12345-abc', 'GET');
      const res = await GET(req);

      expect(res.status).toBe(401);
      expect(mockQueue.getJob).not.toHaveBeenCalled();
    });

    it('returns 403 Forbidden for non-admin users', async () => {
      vi.mocked(getCurrentSession).mockResolvedValueOnce({
        user: { id: 'u1', role: 'user' },
      } as any);

      const req = createRequest('https://codesync.com/api/v1/admin/diagnostics/queue-smoke-test?jobId=smoke-test-12345-abc', 'GET');
      const res = await GET(req);

      expect(res.status).toBe(403);
      expect(mockQueue.getJob).not.toHaveBeenCalled();
    });

    it('returns 400 Bad Request when jobId query parameter is missing', async () => {
      vi.mocked(getCurrentSession).mockResolvedValueOnce({
        user: { id: 'a1', role: 'admin' },
      } as any);

      const req = createRequest('https://codesync.com/api/v1/admin/diagnostics/queue-smoke-test', 'GET');
      const res = await GET(req);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/Missing jobId/i);
    });

    it('returns 400 Bad Request when jobId is malformed or not a smoke-test ID', async () => {
      vi.mocked(getCurrentSession).mockResolvedValueOnce({
        user: { id: 'a1', role: 'admin' },
      } as any);

      const invalidIds = ['regular-job-123', 'smoke-test', 'smoke-test-notimestamp', 'arbitrary-id', '../../../etc/passwd'];
      for (const invalidId of invalidIds) {
        const req = createRequest(`https://codesync.com/api/v1/admin/diagnostics/queue-smoke-test?jobId=${invalidId}`, 'GET');
        const res = await GET(req);
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toMatch(/Invalid smoke-test job ID format/i);
      }
      expect(mockQueue.getJob).not.toHaveBeenCalled();
    });

    it('returns 404 Not Found when the smoke-test job is not found or expired', async () => {
      vi.mocked(getCurrentSession).mockResolvedValueOnce({
        user: { id: 'a1', role: 'admin' },
      } as any);

      mockQueue.getJob.mockResolvedValueOnce(null);

      const req = createRequest('https://codesync.com/api/v1/admin/diagnostics/queue-smoke-test?jobId=smoke-test-1729864200000-xyz123', 'GET');
      const res = await GET(req);

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toMatch(/not found or expired/i);
    });

    it('returns 200 with job state and safe metadata when job is found', async () => {
      vi.mocked(getCurrentSession).mockResolvedValueOnce({
        user: { id: 'a1', role: 'admin' },
      } as any);

      mockQueue.getJob.mockResolvedValueOnce({
        id: 'smoke-test-1729864200000-xyz123',
        name: 'recompute',
        timestamp: 1729864200000,
        processedOn: 1729864200100,
        finishedOn: 1729864200150,
        getState: vi.fn().mockResolvedValue('completed'),
        // ensure internal data is not returned
        data: { secret: 'should-not-leak' },
      });

      const req = createRequest('https://codesync.com/api/v1/admin/diagnostics/queue-smoke-test?jobId=smoke-test-1729864200000-xyz123', 'GET');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data).toEqual({
        jobId: 'smoke-test-1729864200000-xyz123',
        name: 'recompute',
        state: 'completed',
        timestamp: 1729864200000,
        processedOn: 1729864200100,
        finishedOn: 1729864200150,
      });
      expect(json.data.data).toBeUndefined();
    });
  });

  describe('Worker empty-payload no-op verification', () => {
    it('calling processMatchingJob with empty payload performs zero matching computation', async () => {
      await processMatchingJob({
        id: 'smoke-test-999-empty',
        data: {},
      });

      expect(matchingService.recomputeAndPersistMatch).not.toHaveBeenCalled();
      expect(matchingService.recomputeAllForUser).not.toHaveBeenCalled();
      expect(matchingService.recomputeAllForProject).not.toHaveBeenCalled();
    });

    it('calling processMatchingJob with both userId and projectId calls recomputeAndPersistMatch', async () => {
      await processMatchingJob({
        id: 'real-job-1',
        data: { userId: 'u1', projectId: 'p1' },
      });

      expect(matchingService.recomputeAndPersistMatch).toHaveBeenCalledWith('u1', 'p1');
      expect(matchingService.recomputeAllForUser).not.toHaveBeenCalled();
      expect(matchingService.recomputeAllForProject).not.toHaveBeenCalled();
    });

    it('calling processMatchingJob with only userId calls recomputeAllForUser', async () => {
      await processMatchingJob({
        id: 'real-job-2',
        data: { userId: 'u1' },
      });

      expect(matchingService.recomputeAndPersistMatch).not.toHaveBeenCalled();
      expect(matchingService.recomputeAllForUser).toHaveBeenCalledWith('u1');
      expect(matchingService.recomputeAllForProject).not.toHaveBeenCalled();
    });

    it('calling processMatchingJob with only projectId calls recomputeAllForProject', async () => {
      await processMatchingJob({
        id: 'real-job-3',
        data: { projectId: 'p1' },
      });

      expect(matchingService.recomputeAndPersistMatch).not.toHaveBeenCalled();
      expect(matchingService.recomputeAllForUser).not.toHaveBeenCalled();
      expect(matchingService.recomputeAllForProject).toHaveBeenCalledWith('p1');
    });
  });
});
