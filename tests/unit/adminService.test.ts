import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getReports, resolveReport, suspendUser, toggleProjectModeration, resolvePendingSkill, updatePlatformConfig } from '../../apps/web/src/server/services/adminService';
import { ForbiddenError, NotFoundError, ConflictError } from '../../apps/web/src/server/errors';
import { prisma } from '../../apps/web/src/server/db';

vi.mock('../../apps/web/src/server/db', () => ({
  prisma: {
    report: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    user: { findUnique: vi.fn(), update: vi.fn() },
    project: { findUnique: vi.fn(), update: vi.fn() },
    skill: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
    userSkill: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
    projectSkill: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
    projectRoleSkill: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
    adminAction: { create: vi.fn() },
    auditLog: { create: vi.fn() },
    platformConfig: { upsert: vi.fn() },
    $transaction: vi.fn((fn) => fn(prisma)),
  }
}));

vi.mock('../../apps/web/src/server/services/notificationService', () => ({
  createNotification: vi.fn().mockResolvedValue({})
}));

describe('adminService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const user = { id: 'u1', role: 'user' };
  const mod = { id: 'm1', role: 'moderator' };
  const admin = { id: 'a1', role: 'admin' };

  describe('RBAC', () => {
    it('rejects regular users from moderation endpoints', async () => {
      await expect(getReports(user)).rejects.toThrow(ForbiddenError);
      await expect(resolveReport(user, 'r1', 'actioned', 'notes')).rejects.toThrow(ForbiddenError);
      await expect(suspendUser(user, 'u2', 'spam')).rejects.toThrow(ForbiddenError);
      await expect(toggleProjectModeration(user, 'p1', true, 'spam')).rejects.toThrow(ForbiddenError);
      await expect(resolvePendingSkill(user, 's1', 'approve')).rejects.toThrow(ForbiddenError);
    });

    it('allows moderators for moderation, rejects for config', async () => {
      vi.mocked(prisma.report.findMany).mockResolvedValue([]);
      await getReports(mod); // should not throw

      await expect(updatePlatformConfig(mod, 'key', 'val')).rejects.toThrow(ForbiddenError);
    });

    it('allows admins for config', async () => {
      vi.mocked(prisma.platformConfig.upsert).mockResolvedValue({} as any);
      await updatePlatformConfig(admin, 'key', 'val');
      expect(prisma.platformConfig.upsert).toHaveBeenCalled();
    });
  });

  describe('suspendUser', () => {
    it('prevents self suspension', async () => {
      await expect(suspendUser(admin, admin.id, 'test')).rejects.toThrow(ForbiddenError);
    });

    it('prevents moderators from suspending admins', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'a2', role: 'admin' } as any);
      await expect(suspendUser(mod, 'a2', 'spam')).rejects.toThrow(ForbiddenError);
    });

    it('suspends user, creates action and audit log', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'u2', role: 'user' } as any);
      vi.mocked(prisma.user.update).mockResolvedValue({ id: 'u2' } as any);
      
      await suspendUser(mod, 'u2', 'spam');

      expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: 'suspended', sessionVersion: { increment: 1 } })
      }));
      expect(prisma.adminAction.create).toHaveBeenCalled();
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });
  });

  describe('resolvePendingSkill', () => {
    it('requires target skill for merge', async () => {
      vi.mocked(prisma.skill.findUnique).mockResolvedValue({ id: 's1', status: 'pending' } as any);
      await expect(resolvePendingSkill(admin, 's1', 'merge')).rejects.toThrow(ConflictError);
    });

    it('handles approval correctly', async () => {
      vi.mocked(prisma.skill.findUnique).mockResolvedValue({ id: 's1', status: 'pending' } as any);
      await resolvePendingSkill(admin, 's1', 'approve');
      expect(prisma.skill.update).toHaveBeenCalledWith(expect.objectContaining({ data: { status: 'approved' } }));
    });
  });
});
