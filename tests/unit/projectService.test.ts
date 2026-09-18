import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getProjectById, deleteProject, updateProject, publishProject } from '../../apps/web/src/server/services/projectService';
import { prisma } from '../../apps/web/src/server/db';
import { NotFoundError, ForbiddenError } from '../../apps/web/src/server/errors';
import { createNotification } from '../../apps/web/src/server/services/notificationService';
import { enqueueNotification } from '@codesync/core/queue';

vi.mock('@codesync/core/queue', () => ({
  enqueueMatchRecompute: vi.fn(),
  enqueueNotification: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('../../apps/web/src/server/db', () => ({
  prisma: {
    project: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    projectMember: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
    projectSkill: { deleteMany: vi.fn() },
    projectRole: { deleteMany: vi.fn() },
  }
}));

vi.mock('../../apps/web/src/server/services/notificationService', () => ({
  createNotification: vi.fn().mockResolvedValue({ id: 'notif-1', payload: {} })
}));


describe('projectService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
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

  describe('updateProject', () => {
    const defaultData = { name: 'Updated' } as any;

    it('throws ForbiddenError if not owner', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue({ ownerId: 'owner1' } as any);
      await expect(updateProject('user2', 'p1', defaultData)).rejects.toThrow(ForbiddenError);
    });

    it('updates project and notifies active members except owner', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue({ ownerId: 'owner1' } as any);
      vi.mocked(prisma.project.update).mockResolvedValue({ id: 'p1', name: 'Updated' } as any);
      vi.mocked(prisma.projectMember.findMany).mockResolvedValue([
        { userId: 'owner1', status: 'active' },
        { userId: 'member1', status: 'active' },
        { userId: 'member2', status: 'active' }
      ] as any);

      await updateProject('owner1', 'p1', defaultData);

      // Core update happens
      expect(prisma.project.update).toHaveBeenCalled();
      
      // Member lookup happens
      expect(prisma.projectMember.findMany).toHaveBeenCalledWith({
        where: { projectId: 'p1', status: 'active' }
      });

      // Notification sent to member1 and member2, NOT owner1
      expect(createNotification).toHaveBeenCalledTimes(2);
      expect(createNotification).toHaveBeenCalledWith('member1', 'PROJECT_ACTIVITY', expect.objectContaining({
        event: 'project_updated',
        projectId: 'p1'
      }));
      expect(createNotification).toHaveBeenCalledWith('member2', 'PROJECT_ACTIVITY', expect.objectContaining({
        event: 'project_updated',
        projectId: 'p1'
      }));

      // Queue is called
      expect(enqueueNotification).toHaveBeenCalledTimes(2);
    });

    it('does not rollback project update if notification fails', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue({ ownerId: 'owner1' } as any);
      vi.mocked(prisma.project.update).mockResolvedValue({ id: 'p1', name: 'Updated' } as any);
      vi.mocked(prisma.projectMember.findMany).mockResolvedValue([
        { userId: 'member1', status: 'active' }
      ] as any);
      
      vi.mocked(createNotification).mockRejectedValueOnce(new Error('Redis is down'));

      const result = await updateProject('owner1', 'p1', defaultData);
      
      // Update still successful
      expect(result.id).toBe('p1');
      expect(prisma.project.update).toHaveBeenCalled();
    });
  });
});

