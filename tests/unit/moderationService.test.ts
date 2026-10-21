import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createReport } from '../../apps/web/src/server/services/moderationService';
import { ForbiddenError, NotFoundError, ConflictError } from '../../apps/web/src/server/errors';
import { prisma } from '../../apps/web/src/server/db';

vi.mock('../../apps/web/src/server/db', () => {
  const mockPrisma: any = {
    report: { findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    user: { findUnique: vi.fn(), update: vi.fn() },
    project: { findUnique: vi.fn(), update: vi.fn() },
    message: { findUnique: vi.fn() },
    auditLog: { create: vi.fn() },
    $transaction: vi.fn(async (fn: any) => fn(mockPrisma)),
  };
  return { prisma: mockPrisma };
});

describe('moderationService - createReport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const reporterId = 'user_reporter_1';
  const targetUserId = 'user_target_2';

  describe('Validation & Authorization', () => {
    it('throws ForbiddenError if reporterId is empty', async () => {
      await expect(
        createReport('', {
          targetType: 'user',
          targetId: targetUserId,
          reason: 'spam',
        })
      ).rejects.toThrow(ForbiddenError);
    });

    it('throws validation error on invalid targetType', async () => {
      await expect(
        createReport(reporterId, {
          targetType: 'invalid' as any,
          targetId: targetUserId,
          reason: 'spam',
        })
      ).rejects.toThrow();
    });

    it('throws validation error if targetId is empty', async () => {
      await expect(
        createReport(reporterId, {
          targetType: 'user',
          targetId: '',
          reason: 'spam',
        })
      ).rejects.toThrow();
    });

    it('prevents self-reporting for targetType user', async () => {
      await expect(
        createReport(reporterId, {
          targetType: 'user',
          targetId: reporterId,
          reason: 'spam',
        })
      ).rejects.toThrow(ForbiddenError);
    });

    it('prevents reporting own project', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue({
        id: 'proj_1',
        ownerId: reporterId,
      } as any);

      await expect(
        createReport(reporterId, {
          targetType: 'project',
          targetId: 'proj_1',
          reason: 'spam',
        })
      ).rejects.toThrow(ForbiddenError);
    });

    it('prevents reporting own message', async () => {
      vi.mocked(prisma.message.findUnique).mockResolvedValue({
        id: 'msg_1',
        senderId: reporterId,
      } as any);

      await expect(
        createReport(reporterId, {
          targetType: 'message',
          targetId: 'msg_1',
          reason: 'harassment',
        })
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('Target Existence', () => {
    it('throws NotFoundError if target user does not exist', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(
        createReport(reporterId, {
          targetType: 'user',
          targetId: targetUserId,
          reason: 'spam',
        })
      ).rejects.toThrow(NotFoundError);
    });

    it('throws NotFoundError if target project does not exist', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue(null);

      await expect(
        createReport(reporterId, {
          targetType: 'project',
          targetId: 'non_existent_proj',
          reason: 'spam',
        })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('Duplicate Prevention', () => {
    it('throws ConflictError if an open report already exists for the same target', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: targetUserId } as any);
      vi.mocked(prisma.report.findFirst).mockResolvedValue({
        id: 'existing_rep',
        reporterId,
        targetType: 'user',
        targetId: targetUserId,
        status: 'open',
      } as any);

      await expect(
        createReport(reporterId, {
          targetType: 'user',
          targetId: targetUserId,
          reason: 'spam',
        })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('Successful Creation', () => {
    it('creates report with combined reason and description, and creates AuditLog', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: targetUserId } as any);
      vi.mocked(prisma.report.findFirst).mockResolvedValue(null);
      const mockCreatedReport = {
        id: 'rep_123',
        reporterId,
        targetType: 'user',
        targetId: targetUserId,
        reason: 'spam: Looks like spam',
        status: 'open',
        createdAt: new Date(),
      };
      vi.mocked(prisma.report.create).mockResolvedValue(mockCreatedReport as any);

      const result = await createReport(reporterId, {
        targetType: 'user',
        targetId: targetUserId,
        reason: 'spam',
        description: 'Looks like spam',
      });

      expect(result).toEqual(mockCreatedReport);
      expect(prisma.report.create).toHaveBeenCalledWith({
        data: {
          reporterId,
          targetType: 'user',
          targetId: targetUserId,
          reason: 'spam: Looks like spam',
          status: 'open',
        },
      });
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          actorId: reporterId,
          action: 'report_created',
          entityType: 'report',
          entityId: 'rep_123',
          metadata: {
            targetType: 'user',
            targetId: targetUserId,
            reasonCategory: 'spam',
          },
        },
      });
    });

    it('creates report without description', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: targetUserId } as any);
      vi.mocked(prisma.report.findFirst).mockResolvedValue(null);
      const mockCreatedReport = {
        id: 'rep_124',
        reporterId,
        targetType: 'user',
        targetId: targetUserId,
        reason: 'harassment',
        status: 'open',
        createdAt: new Date(),
      };
      vi.mocked(prisma.report.create).mockResolvedValue(mockCreatedReport as any);

      const result = await createReport(reporterId, {
        targetType: 'user',
        targetId: targetUserId,
        reason: 'harassment',
      });

      expect(result).toEqual(mockCreatedReport);
      expect(prisma.report.create).toHaveBeenCalledWith({
        data: {
          reporterId,
          targetType: 'user',
          targetId: targetUserId,
          reason: 'harassment',
          status: 'open',
        },
      });
    });
  });
});
