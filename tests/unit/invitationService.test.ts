import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Prisma } from '@prisma/client';
import { inviteDeveloper, getInvitationsForDeveloper, respondToInvitation } from '../../apps/web/src/server/services/invitationService';
import { prisma } from '../../apps/web/src/server/db';
import { NotFoundError, ForbiddenError, ConflictError } from '../../apps/web/src/server/errors';

vi.mock('../../apps/web/src/server/db', () => ({
  prisma: {
    project: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    invitation: {
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

vi.mock('../../apps/web/src/server/services/notificationService', () => ({
  createNotification: vi.fn().mockResolvedValue({ id: 'notif-1', payload: {} }),
}));

vi.mock('../../apps/web/src/server/jobs/queue', () => ({
  enqueueNotification: vi.fn().mockResolvedValue(undefined),
}));

import { createNotification } from '../../apps/web/src/server/services/notificationService';
import { enqueueNotification } from '../../apps/web/src/server/jobs/queue';

describe('invitationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('inviteDeveloper', () => {
    it('throws NotFoundError if project does not exist', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue(null as any);
      await expect(inviteDeveloper('owner1', 'p1', { invitedUserId: 'dev1', matchScoreSnapshot: 95, reasonSnapshot: {} }))
        .rejects.toThrow(NotFoundError);
    });

    it('throws ForbiddenError if user is not the project owner', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue({ id: 'p1', ownerId: 'owner2', status: 'open' } as any);
      await expect(inviteDeveloper('owner1', 'p1', { invitedUserId: 'dev1', matchScoreSnapshot: 95, reasonSnapshot: {} }))
        .rejects.toThrow(ForbiddenError);
    });

    it('throws ConflictError if project is not open', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue({ id: 'p1', ownerId: 'owner1', status: 'draft' } as any);
      await expect(inviteDeveloper('owner1', 'p1', { invitedUserId: 'dev1', matchScoreSnapshot: 95, reasonSnapshot: {} }))
        .rejects.toThrow(ConflictError);
    });

    it('throws NotFoundError if specified role does not exist', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue({
        id: 'p1', ownerId: 'owner1', status: 'open', projectRoles: [{ id: 'role1' }]
      } as any);
      await expect(inviteDeveloper('owner1', 'p1', { invitedUserId: 'dev1', roleId: 'role2', matchScoreSnapshot: 95, reasonSnapshot: {} }))
        .rejects.toThrow(NotFoundError);
    });

    it('throws NotFoundError if invited developer does not exist', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue({ id: 'p1', ownerId: 'owner1', status: 'open', projectRoles: [] } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null as any);
      await expect(inviteDeveloper('owner1', 'p1', { invitedUserId: 'dev1', matchScoreSnapshot: 95, reasonSnapshot: {} }))
        .rejects.toThrow(NotFoundError);
    });

    it('throws ConflictError if user is already a project member', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue({ id: 'p1', ownerId: 'owner1', status: 'open', projectRoles: [] } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'dev1' } as any);
      vi.mocked(prisma.projectMember.findUnique).mockResolvedValue({ id: 'pm1' } as any);
      await expect(inviteDeveloper('owner1', 'p1', { invitedUserId: 'dev1', matchScoreSnapshot: 95, reasonSnapshot: {} }))
        .rejects.toThrow(ConflictError);
    });

    it('throws ConflictError if a concurrent duplicate violates the database unique constraint', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue({ id: 'p1', ownerId: 'owner1', status: 'open', projectRoles: [] } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'dev1' } as any);
      vi.mocked(prisma.projectMember.findUnique).mockResolvedValue(null as any);
      
      const p2002Error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '5.22.0',
      });
      vi.mocked(prisma.invitation.create).mockRejectedValue(p2002Error);

      await expect(inviteDeveloper('owner1', 'p1', { invitedUserId: 'dev1', matchScoreSnapshot: 95, reasonSnapshot: {} }))
        .rejects.toThrow(ConflictError);
    });

    it('creates an invitation successfully', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue({ id: 'p1', ownerId: 'owner1', status: 'open', projectRoles: [] } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'dev1' } as any);
      vi.mocked(prisma.projectMember.findUnique).mockResolvedValue(null as any);
      vi.mocked(prisma.invitation.create).mockResolvedValue({ id: 'inv1', status: 'invited' } as any);

      const result = await inviteDeveloper('owner1', 'p1', { invitedUserId: 'dev1', matchScoreSnapshot: 95, reasonSnapshot: {} });
      expect(result.id).toBe('inv1');
      expect(prisma.invitation.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: 'invited' })
      }));
    });
  });

  describe('getInvitationsForDeveloper', () => {
    it('returns invitations for the developer', async () => {
      vi.mocked(prisma.invitation.findMany).mockResolvedValue([{ id: 'inv1' }] as any);
      const invs = await getInvitationsForDeveloper('dev1');
      expect(invs).toHaveLength(1);
      expect(prisma.invitation.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { invitedUserId: 'dev1' } }));
    });
  });

  describe('respondToInvitation', () => {
    it('throws ForbiddenError if not the developer', async () => {
      vi.mocked(prisma.invitation.findUnique).mockResolvedValue({ id: 'inv1', invitedUserId: 'dev1', status: 'invited' } as any);
      await expect(respondToInvitation('owner1', 'inv1', { action: 'accept' })).rejects.toThrow(ForbiddenError);
    });

    it('throws ConflictError on invalid state transition', async () => {
      vi.mocked(prisma.invitation.findUnique).mockResolvedValue({ id: 'inv1', invitedUserId: 'dev1', status: 'declined' } as any);
      await expect(respondToInvitation('dev1', 'inv1', { action: 'accept' })).rejects.toThrow(ConflictError);
    });

    it('declines successfully', async () => {
      vi.mocked(prisma.invitation.findUnique).mockResolvedValue({ id: 'inv1', invitedUserId: 'dev1', status: 'invited' } as any);
      vi.mocked(prisma.invitation.update).mockResolvedValue({ id: 'inv1', status: 'declined' } as any);
      const res = await respondToInvitation('dev1', 'inv1', { action: 'decline' });
      expect(res.status).toBe('declined');
    });

    it('accepts successfully, creates project member, and increments team size', async () => {
      vi.mocked(prisma.invitation.findUnique).mockResolvedValue({ 
        id: 'inv1', status: 'invited', projectId: 'p1', invitedUserId: 'dev1', roleId: 'r1'
      } as any);
      vi.mocked(prisma.projectMember.findUnique).mockResolvedValue(null as any);
      vi.mocked(prisma.invitation.update).mockResolvedValue({ id: 'inv1', status: 'accepted' } as any);
      vi.mocked(prisma.projectMember.create).mockResolvedValue({ id: 'pm1' } as any);

      await respondToInvitation('dev1', 'inv1', { action: 'accept' });
      
      expect(prisma.projectMember.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ projectId: 'p1', userId: 'dev1', roleId: 'r1', status: 'active' })
      }));
      expect(prisma.project.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'p1' },
        data: { teamSizeCurrent: { increment: 1 } }
      }));
    });
  });
});
