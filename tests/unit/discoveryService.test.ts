import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchProjects, searchDevelopers } from '../../apps/web/src/server/services/discoveryService';
import { prisma } from '../../apps/web/src/server/db';

vi.mock('../../apps/web/src/server/db', () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}));

describe('Discovery Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('searchProjects', () => {
    it('should generate text search condition when q is provided', async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([]);
      
      await searchProjects('user-1', {
        q: 'react frontend',
        limit: 10,
        sort: 'relevance'
      });

      expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
      const callArgs = vi.mocked(prisma.$queryRaw).mock.calls[0][0];
      const sqlString = Object.values(callArgs).join(' ');
      
      expect(sqlString).toContain('react:* & frontend:*');
      expect(sqlString).toContain('@@ to_tsquery');
    });

    it('should exclude drafts and paused projects, and suspended owners', async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([]);
      
      await searchProjects('user-1', { limit: 10, sort: 'recency' });

      const callArgs = vi.mocked(prisma.$queryRaw).mock.calls[0][0];
      const sqlString = Object.values(callArgs).join(' ');
      expect(sqlString).toContain("p.status = 'open'");
      expect(sqlString).toContain("status = 'suspended'");
    });

    it('should apply filters (skills, category, difficulty, availability, projectType)', async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([]);
      
      await searchProjects('user-1', { 
        limit: 10, sort: 'recency',
        skills: ['React'],
        category: ['Web'],
        difficulty: ['beginner'],
        availability: ['10-20h'],
        projectType: ['open_source']
      });

      const callArgs = vi.mocked(prisma.$queryRaw).mock.calls[0][0];
      const sqlString = Object.values(callArgs).join(' ');
      
      expect(sqlString).toContain('"ProjectSkill"');
      expect(sqlString).toContain('p.category IN');
      expect(sqlString).toContain('p."experienceRequirement" IN');
      expect(sqlString).toContain('p."weeklyCommitment" IN');
      expect(sqlString).toContain('p."collaborationType" && ARRAY[');
    });

    it('should paginate correctly using cursor', async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([
        { id: 'proj-1', createdAt: new Date('2026-01-01') },
        { id: 'proj-2', createdAt: new Date('2026-01-01') }
      ]);
      
      const res = await searchProjects(null, { limit: 1, sort: 'recency' });

      expect(res.items.length).toBe(1);
      expect(res.items[0].id).toBe('proj-1');
      expect(res.nextCursor).toBeDefined();

      const decoded = JSON.parse(Buffer.from(res.nextCursor!, 'base64').toString('utf8'));
      expect(decoded.id).toBe('proj-2');
    });
  });

  describe('searchDevelopers', () => {
    it('should generate text search condition when q is provided', async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([]);
      
      await searchDevelopers('user-1', {
        q: 'fullstack node',
        limit: 10,
        sort: 'recency'
      });

      expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
      const callArgs = vi.mocked(prisma.$queryRaw).mock.calls[0][0];
      const sqlString = Object.values(callArgs).join(' ');
      
      expect(sqlString).toContain('fullstack:* & node:*');
      expect(sqlString).toContain('@@ to_tsquery');
    });

    it('should exclude suspended users and require public profiles', async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([]);
      
      await searchDevelopers('user-1', { limit: 10, sort: 'recency' });

      const callArgs = vi.mocked(prisma.$queryRaw).mock.calls[0][0];
      const sqlString = Object.values(callArgs).join(' ');
      
      expect(sqlString).toContain("u.status != 'suspended'");
      expect(sqlString).toContain('p."profileVisibility" = \'public\'');
    });

    it('should join with Match table when relevance sort is requested with projectId', async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([]);
      
      await searchDevelopers('user-1', { 
        limit: 10, sort: 'relevance', projectId: 'proj-1' 
      });

      const callArgs = vi.mocked(prisma.$queryRaw).mock.calls[0][0];
      const sqlString = Object.values(callArgs).join(' ');
      
      expect(sqlString).toContain('LEFT JOIN "Match" m');
      expect(sqlString).toContain('m."projectId" =');
      expect(sqlString).toContain('ORDER BY m.score DESC');
    });
    
    it('should apply filters (experience, location, availability, projectInterests)', async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([]);
      
      await searchDevelopers('user-1', { 
        limit: 10, sort: 'recency',
        experience: ['advanced'],
        location: 'Berlin',
        availability: ['available'],
        projectInterests: ['startup']
      });

      const callArgs = vi.mocked(prisma.$queryRaw).mock.calls[0][0];
      const sqlString = Object.values(callArgs).join(' ');
      
      expect(sqlString).toContain('p."experienceLevel" IN');
      expect(sqlString).toContain('p.location ILIKE');
      expect(sqlString).toContain('p.availability IN');
      expect(sqlString).toContain('p."preferredCollaboration" && ARRAY[');
    });
  });
});
