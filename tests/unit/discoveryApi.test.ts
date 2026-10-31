import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getProjects, POST as postProjects } from '../../apps/web/app/api/v1/projects/route';
import { GET as getDevelopers } from '../../apps/web/app/api/v1/developers/route';
import { GET as getRecommendedDevelopers } from '../../apps/web/app/api/v1/matches/developers/route';
import { searchProjects, searchDevelopers } from '../../apps/web/src/server/services/discoveryService';

import { NextResponse } from 'next/server';

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

import { getCurrentSession } from '../../apps/web/src/lib/auth';

vi.mock('../../apps/web/src/server/services/projectService', () => ({
  createProject: vi.fn(),
}));

vi.mock('../../apps/web/src/lib/validations/project', () => ({
  projectSchema: {},
}));

vi.mock('../../apps/web/src/server/errors', () => ({
  DomainError: class extends Error {},
}));

vi.mock('../../apps/web/src/server/services/discoveryService', () => ({
  searchProjects: vi.fn(),
  searchDevelopers: vi.fn(),
}));

function createMockRequest(url: string) {
  return {
    url,
  } as Request;
}

describe('Discovery APIs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/projects', () => {
    it('should parse query params and call searchProjects', async () => {
      vi.mocked(getCurrentSession).mockResolvedValueOnce({ user: { id: 'user-1' } } as any);
      vi.mocked(searchProjects).mockResolvedValueOnce({ items: [], nextCursor: undefined });

      const req = createMockRequest('http://localhost/api/v1/projects?q=react&skills=React&skills=Node&limit=10');
      const res = await getProjects(req);
      const json = await (res as any).json();

      expect(res.status).toBe(200);
      expect(searchProjects).toHaveBeenCalledWith('user-1', expect.objectContaining({
        q: 'react',
        skills: ['React', 'Node'],
        limit: 10
      }));
    });

    it('should allow unauthenticated access and pass null userId to searchProjects', async () => {
      vi.mocked(getCurrentSession).mockResolvedValueOnce(null);
      vi.mocked(searchProjects).mockResolvedValueOnce({ items: [], nextCursor: undefined });

      const req = createMockRequest('http://localhost/api/v1/projects?q=react');
      const res = await getProjects(req);

      expect(res.status).toBe(200);
      expect(searchProjects).toHaveBeenCalledWith(null, expect.objectContaining({
        q: 'react',
      }));
    });

    it('should parse duration and category query params and pass them to searchProjects', async () => {
      vi.mocked(getCurrentSession).mockResolvedValueOnce(null);
      vi.mocked(searchProjects).mockResolvedValueOnce({ items: [], nextCursor: undefined });

      const req = createMockRequest('http://localhost/api/v1/projects?category=Web%20Development&duration=1_to_3_months&difficulty=intermediate');
      const res = await getProjects(req);

      expect(res.status).toBe(200);
      expect(searchProjects).toHaveBeenCalledWith(null, expect.objectContaining({
        category: ['Web Development'],
        duration: ['1_to_3_months'],
        difficulty: ['intermediate'],
      }));
    });

    it('should return 400 on validation error (e.g. limit too high)', async () => {
      vi.mocked(getCurrentSession).mockResolvedValueOnce({ user: { id: 'user-1' } } as any);

      const req = createMockRequest('http://localhost/api/v1/projects?limit=500');
      const res = await getProjects(req);
      
      expect(res.status).toBe(400);
      expect(searchProjects).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/developers', () => {
    it('should parse query params and call searchDevelopers', async () => {
      vi.mocked(getCurrentSession).mockResolvedValueOnce({ user: { id: 'user-1' } } as any);
      vi.mocked(searchDevelopers).mockResolvedValueOnce({ items: [], nextCursor: undefined });

      const req = createMockRequest('http://localhost/api/v1/developers?location=Berlin&experience=advanced&projectInterests=startup');
      const res = await getDevelopers(req);
      
      expect(res.status).toBe(200);
      expect(searchDevelopers).toHaveBeenCalledWith('user-1', expect.objectContaining({
        location: 'Berlin',
        experience: ['advanced'],
        projectInterests: ['startup']
      }));
    });

    it('should allow unauthenticated access and pass null userId to searchDevelopers', async () => {
      vi.mocked(getCurrentSession).mockResolvedValueOnce(null);
      vi.mocked(searchDevelopers).mockResolvedValueOnce({ items: [], nextCursor: undefined });

      const req = createMockRequest('http://localhost/api/v1/developers?q=Elena');
      const res = await getDevelopers(req);

      expect(res.status).toBe(200);
      expect(searchDevelopers).toHaveBeenCalledWith(null, expect.objectContaining({
        q: 'Elena',
      }));
    });
  });

  describe('POST /api/v1/projects', () => {
    it('should reject unauthenticated project creation with 401', async () => {
      vi.mocked(getCurrentSession).mockResolvedValueOnce(null);

      const req = {
        json: async () => ({ name: 'Test Project' }),
      } as Request;

      const res = await postProjects(req);
      expect(res.status).toBe(401);
      const json = await (res as any).json();
      expect(json.error).toBe('Unauthorized');
    });
  });

  describe('GET /api/v1/matches/developers', () => {
    it('should require authentication', async () => {
      vi.mocked(getCurrentSession).mockResolvedValueOnce(null);

      const req = createMockRequest('http://localhost/api/v1/matches/developers?projectId=proj-1');
      const res = await getRecommendedDevelopers(req);
      
      expect(res.status).toBe(401);
    });

    it('should require projectId', async () => {
      vi.mocked(getCurrentSession).mockResolvedValueOnce({ user: { id: 'user-1' } } as any);

      const req = createMockRequest('http://localhost/api/v1/matches/developers');
      const res = await getRecommendedDevelopers(req);
      
      expect(res.status).toBe(400);
      const json = await (res as any).json();
      expect(json.error).toContain('projectId is required');
    });

    it('should force relevance sort and call searchDevelopers', async () => {
      vi.mocked(getCurrentSession).mockResolvedValueOnce({ user: { id: 'user-1' } } as any);
      vi.mocked(searchDevelopers).mockResolvedValueOnce({ items: [], nextCursor: undefined });

      const req = createMockRequest('http://localhost/api/v1/matches/developers?projectId=proj-1&skills=React');
      const res = await getRecommendedDevelopers(req);
      
      expect(res.status).toBe(200);
      expect(searchDevelopers).toHaveBeenCalledWith('user-1', expect.objectContaining({
        projectId: 'proj-1',
        sort: 'relevance',
        skills: ['React']
      }));
    });
  });
});
