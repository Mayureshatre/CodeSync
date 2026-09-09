import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Prisma } from '@prisma/client';
import { saveProject, getSavedProjects, removeSavedProject, saveDeveloper, getSavedDevelopers, removeSavedDeveloper, saveSearch, getSavedSearches, removeSavedSearch } from '../../apps/web/src/server/services/savedItemService';
import { prisma } from '../../apps/web/src/server/db';
import { NotFoundError, ForbiddenError, ConflictError } from '../../apps/web/src/server/errors';

vi.mock('../../apps/web/src/server/db', () => ({
  prisma: {
    project: { findUnique: vi.fn() },
    user: { findUnique: vi.fn() },
    savedProject: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    savedDeveloper: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    savedSearch: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  }
}));

describe('savedItemService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('saveProject', () => {
    it('throws NotFoundError if project does not exist', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue(null as any);
      await expect(saveProject('user1', { targetId: 'p1' })).rejects.toThrow(NotFoundError);
    });

    it('throws ConflictError on duplicate save (P2002)', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue({ id: 'p1' } as any);
      const p2002Error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '5.22.0',
      });
      vi.mocked(prisma.savedProject.create).mockRejectedValue(p2002Error);
      await expect(saveProject('user1', { targetId: 'p1' })).rejects.toThrow(ConflictError);
    });

    it('creates savedProject', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue({ id: 'p1' } as any);
      vi.mocked(prisma.savedProject.create).mockResolvedValue({ id: 'sp1' } as any);
      const res = await saveProject('user1', { targetId: 'p1' });
      expect(res.id).toBe('sp1');
      expect(prisma.savedProject.create).toHaveBeenCalledWith(expect.objectContaining({ data: { userId: 'user1', targetId: 'p1' } }));
    });
  });

  describe('removeSavedProject', () => {
    it('throws NotFoundError if not found', async () => {
      vi.mocked(prisma.savedProject.findUnique).mockResolvedValue(null as any);
      await expect(removeSavedProject('user1', 'sp1')).rejects.toThrow(NotFoundError);
    });

    it('throws ForbiddenError if not owner', async () => {
      vi.mocked(prisma.savedProject.findUnique).mockResolvedValue({ id: 'sp1', userId: 'user2' } as any);
      await expect(removeSavedProject('user1', 'sp1')).rejects.toThrow(ForbiddenError);
    });

    it('deletes savedProject', async () => {
      vi.mocked(prisma.savedProject.findUnique).mockResolvedValue({ id: 'sp1', userId: 'user1' } as any);
      vi.mocked(prisma.savedProject.delete).mockResolvedValue({ id: 'sp1' } as any);
      await removeSavedProject('user1', 'sp1');
      expect(prisma.savedProject.delete).toHaveBeenCalledWith({ where: { id: 'sp1' } });
    });
  });

  describe('saveDeveloper', () => {
    it('throws ConflictError if saving self', async () => {
      await expect(saveDeveloper('dev1', { targetId: 'dev1' })).rejects.toThrow(ConflictError);
    });

    it('throws NotFoundError if user not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null as any);
      await expect(saveDeveloper('dev1', { targetId: 'dev2' })).rejects.toThrow(NotFoundError);
    });

    it('throws ConflictError on duplicate save (P2002)', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'dev2' } as any);
      const p2002Error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '5.22.0',
      });
      vi.mocked(prisma.savedDeveloper.create).mockRejectedValue(p2002Error);
      await expect(saveDeveloper('dev1', { targetId: 'dev2' })).rejects.toThrow(ConflictError);
    });

    it('creates savedDeveloper', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'dev2' } as any);
      vi.mocked(prisma.savedDeveloper.create).mockResolvedValue({ id: 'sd1' } as any);
      const res = await saveDeveloper('dev1', { targetId: 'dev2' });
      expect(res.id).toBe('sd1');
    });
  });

  describe('saveSearch', () => {
    it('throws validation error if empty queryParams', async () => {
      await expect(saveSearch('user1', { queryParams: {} })).rejects.toThrow();
    });

    it('creates savedSearch', async () => {
      vi.mocked(prisma.savedSearch.create).mockResolvedValue({ id: 'ss1' } as any);
      const res = await saveSearch('user1', { queryParams: { keyword: 'react' }, alertEnabled: true });
      expect(res.id).toBe('ss1');
      expect(prisma.savedSearch.create).toHaveBeenCalledWith(expect.objectContaining({
        data: { userId: 'user1', queryParams: { keyword: 'react' }, alertEnabled: true }
      }));
    });
  });

  describe('removeSavedSearch', () => {
    it('throws ForbiddenError if not owner', async () => {
      vi.mocked(prisma.savedSearch.findUnique).mockResolvedValue({ id: 'ss1', userId: 'user2' } as any);
      await expect(removeSavedSearch('user1', 'ss1')).rejects.toThrow(ForbiddenError);
    });

    it('deletes savedSearch', async () => {
      vi.mocked(prisma.savedSearch.findUnique).mockResolvedValue({ id: 'ss1', userId: 'user1' } as any);
      vi.mocked(prisma.savedSearch.delete).mockResolvedValue({ id: 'ss1' } as any);
      await removeSavedSearch('user1', 'ss1');
      expect(prisma.savedSearch.delete).toHaveBeenCalledWith({ where: { id: 'ss1' } });
    });
  });
});
