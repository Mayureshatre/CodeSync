import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Prisma } from '@prisma/client';
import { applyToProject, getApplicationsForDeveloper, getApplicationsForProject, updateApplicationStatus, withdrawApplication } from '../../apps/web/src/server/services/applicationService';
import { prisma } from '../../apps/web/src/server/db';
import { NotFoundError, ForbiddenError, ConflictError } from '../../apps/web/src/server/errors';

vi.mock('../../apps/web/src/server/db', () => ({
  prisma: {
    project: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    application: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    projectMember: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  }
}));

describe('applicationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('applyToProject', () => {
    it('throws NotFoundError if project does not exist', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue(null as any);
      await expect(applyToProject('dev1', 'p1', { message: 'Hello world!' }))
        .rejects.toThrow(NotFoundError);
    });

    it('throws ForbiddenError if developer is the project owner', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue({ id: 'p1', ownerId: 'dev1', status: 'open' } as any);
      await expect(applyToProject('dev1', 'p1', { message: 'Hello world!' }))
        .rejects.toThrow(ForbiddenError);
    });

    it('throws ConflictError if project is not open', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue({ id: 'p1', ownerId: 'owner1', status: 'draft' } as any);
      await expect(applyToProject('dev1', 'p1', { message: 'Hello world!' }))
        .rejects.toThrow(ConflictError);
    });

    it('throws NotFoundError if specified role does not exist', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue({
        id: 'p1', ownerId: 'owner1', status: 'open', projectRoles: [{ id: 'role1' }]
      } as any);
      await expect(applyToProject('dev1', 'p1', { roleId: 'role2', message: 'Hello world!' }))
        .rejects.toThrow(NotFoundError);
    });

    it('throws ConflictError if application already exists', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue({ id: 'p1', ownerId: 'owner1', status: 'open', projectRoles: [] } as any);
      vi.mocked(prisma.application.findFirst).mockResolvedValue({ id: 'a1' } as any);
      await expect(applyToProject('dev1', 'p1', { message: 'Hello world!' }))
        .rejects.toThrow(ConflictError);
    });

    it('throws ConflictError if user is already a project member', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue({ id: 'p1', ownerId: 'owner1', status: 'open', projectRoles: [] } as any);
      vi.mocked(prisma.application.findFirst).mockResolvedValue(null as any);
      vi.mocked(prisma.projectMember.findUnique).mockResolvedValue({ id: 'pm1' } as any);
      await expect(applyToProject('dev1', 'p1', { message: 'Hello world!' }))
        .rejects.toThrow(ConflictError);
    });

    it('throws ConflictError if a concurrent duplicate violates the database unique constraint', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue({ id: 'p1', ownerId: 'owner1', status: 'open', projectRoles: [] } as any);
      vi.mocked(prisma.application.findFirst).mockResolvedValue(null as any);
      vi.mocked(prisma.projectMember.findUnique).mockResolvedValue(null as any);
      
      const p2002Error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '5.22.0',
      });
      vi.mocked(prisma.application.create).mockRejectedValue(p2002Error);

      await expect(applyToProject('dev1', 'p1', { message: 'Hello world!' }))
        .rejects.toThrow(ConflictError);
    });

    it('creates an application successfully', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue({ id: 'p1', ownerId: 'owner1', status: 'open', projectRoles: [] } as any);
      vi.mocked(prisma.application.findFirst).mockResolvedValue(null as any);
      vi.mocked(prisma.projectMember.findUnique).mockResolvedValue(null as any);
      vi.mocked(prisma.application.create).mockResolvedValue({ id: 'a1', status: 'applied' } as any);

      const result = await applyToProject('dev1', 'p1', { message: 'I would like to join the project.' });
      expect(result.id).toBe('a1');
      expect(prisma.application.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: 'applied' })
      }));
    });
  });

  describe('getApplicationsForDeveloper', () => {
    it('returns applications for the developer', async () => {
      vi.mocked(prisma.application.findMany).mockResolvedValue([{ id: 'a1' }] as any);
      const apps = await getApplicationsForDeveloper('dev1');
      expect(apps).toHaveLength(1);
      expect(prisma.application.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'dev1' } }));
    });
  });

  describe('getApplicationsForProject', () => {
    it('throws ForbiddenError if non-owner tries to view', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue({ id: 'p1', ownerId: 'owner1' } as any);
      await expect(getApplicationsForProject('dev1', 'p1')).rejects.toThrow(ForbiddenError);
    });

    it('returns applications for the project owner', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue({ id: 'p1', ownerId: 'owner1' } as any);
      vi.mocked(prisma.application.findMany).mockResolvedValue([{ id: 'a1' }] as any);
      const apps = await getApplicationsForProject('owner1', 'p1');
      expect(apps).toHaveLength(1);
      expect(prisma.application.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { projectId: 'p1' } }));
    });
  });

  describe('updateApplicationStatus', () => {
    it('throws ForbiddenError if non-owner updates status', async () => {
      vi.mocked(prisma.application.findUnique).mockResolvedValue({ id: 'a1', status: 'applied', project: { ownerId: 'owner1' } } as any);
      await expect(updateApplicationStatus('dev1', 'a1', { status: 'shortlisted' })).rejects.toThrow(ForbiddenError);
    });

    it('throws ConflictError on invalid state transition', async () => {
      vi.mocked(prisma.application.findUnique).mockResolvedValue({ id: 'a1', status: 'rejected', project: { ownerId: 'owner1' } } as any);
      await expect(updateApplicationStatus('owner1', 'a1', { status: 'accepted' })).rejects.toThrow(ConflictError);
    });

    it('updates status on valid transition', async () => {
      vi.mocked(prisma.application.findUnique).mockResolvedValue({ id: 'a1', status: 'applied', project: { ownerId: 'owner1' } } as any);
      vi.mocked(prisma.application.update).mockResolvedValue({ id: 'a1', status: 'shortlisted' } as any);
      
      const res = await updateApplicationStatus('owner1', 'a1', { status: 'shortlisted' });
      expect(res.status).toBe('shortlisted');
      expect(prisma.application.update).toHaveBeenCalledWith(expect.objectContaining({ data: { status: 'shortlisted' } }));
    });

    it('creates project member and increments team size when accepted', async () => {
      vi.mocked(prisma.application.findUnique).mockResolvedValue({ 
        id: 'a1', status: 'interviewing', projectId: 'p1', userId: 'dev1', roleId: 'r1', 
        project: { ownerId: 'owner1' } 
      } as any);
      vi.mocked(prisma.projectMember.findUnique).mockResolvedValue(null as any);
      vi.mocked(prisma.application.update).mockResolvedValue({ id: 'a1', status: 'accepted' } as any);
      vi.mocked(prisma.projectMember.create).mockResolvedValue({ id: 'pm1' } as any);

      await updateApplicationStatus('owner1', 'a1', { status: 'accepted' });
      
      expect(prisma.projectMember.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ projectId: 'p1', userId: 'dev1', roleId: 'r1', status: 'active' })
      }));
      expect(prisma.project.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'p1' },
        data: { teamSizeCurrent: { increment: 1 } }
      }));
    });
  });

  describe('withdrawApplication', () => {
    it('throws ForbiddenError if not the developer', async () => {
      vi.mocked(prisma.application.findUnique).mockResolvedValue({ id: 'a1', userId: 'dev1', status: 'applied' } as any);
      await expect(withdrawApplication('owner1', 'a1')).rejects.toThrow(ForbiddenError);
    });

    it('throws ConflictError on invalid state transition', async () => {
      vi.mocked(prisma.application.findUnique).mockResolvedValue({ id: 'a1', userId: 'dev1', status: 'rejected' } as any);
      await expect(withdrawApplication('dev1', 'a1')).rejects.toThrow(ConflictError);
    });

    it('withdraws successfully', async () => {
      vi.mocked(prisma.application.findUnique).mockResolvedValue({ id: 'a1', userId: 'dev1', status: 'under_review' } as any);
      vi.mocked(prisma.application.update).mockResolvedValue({ id: 'a1', status: 'withdrawn' } as any);
      const res = await withdrawApplication('dev1', 'a1');
      expect(res.status).toBe('withdrawn');
    });
  });
});
