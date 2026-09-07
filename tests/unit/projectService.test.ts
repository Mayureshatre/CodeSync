import { describe, it, expect, vi } from 'vitest';
import { getProjectById, deleteProject, updateProject, publishProject } from '../../apps/web/src/server/services/projectService';
import { prisma } from '../../apps/web/src/server/db';
import { NotFoundError, ForbiddenError } from '../../apps/web/src/server/errors';

vi.mock('../../apps/web/src/server/db', () => ({
  prisma: {
    project: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
    projectSkill: { deleteMany: vi.fn() },
    projectRole: { deleteMany: vi.fn() },
  }
}));

describe('projectService', () => {
  describe('getProjectById', () => {
    it('throws NotFoundError if project does not exist', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue(null);
      await expect(getProjectById('p1', 'user1')).rejects.toThrow(NotFoundError);
    });

    it('throws NotFoundError if project is draft and user is not owner', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue({
        id: 'p1',
        ownerId: 'owner1',
        status: 'draft'
      } as any);
      await expect(getProjectById('p1', 'user2')).rejects.toThrow(NotFoundError);
    });

    it('returns project if draft but user is owner', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue({
        id: 'p1',
        ownerId: 'owner1',
        status: 'draft'
      } as any);
      const proj = await getProjectById('p1', 'owner1');
      expect(proj.id).toBe('p1');
    });
  });

  describe('deleteProject', () => {
    it('throws ForbiddenError if not owner', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue({ ownerId: 'owner1' } as any);
      await expect(deleteProject('user2', 'p1')).rejects.toThrow(ForbiddenError);
    });

    it('soft deletes by setting status to archived', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue({ ownerId: 'owner1' } as any);
      vi.mocked(prisma.project.update).mockResolvedValue({ id: 'p1', status: 'archived' } as any);
      await deleteProject('owner1', 'p1');
      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { status: 'archived' }
      });
    });
  });

  describe('publishProject', () => {
    it('throws ForbiddenError if user email is not verified', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue({ ownerId: 'owner1' } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ emailVerifiedAt: null } as any);
      await expect(publishProject('owner1', 'p1')).rejects.toThrow(ForbiddenError);
    });

    it('publishes project if user verified', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue({ ownerId: 'owner1' } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ emailVerifiedAt: new Date() } as any);
      await publishProject('owner1', 'p1');
      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { status: 'open', publishedAt: expect.any(Date) }
      });
    });
  });
});
