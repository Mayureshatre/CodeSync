import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  requestAccountDeletion,
  restoreAccount,
  getAccountStatus
} from '../../apps/web/src/server/services/accountService';
import { prisma } from '../../apps/web/src/server/db';
import * as configService from '../../apps/web/src/server/services/configService';
import { NotFoundError, ConflictError } from '../../apps/web/src/server/errors';

vi.mock('../../apps/web/src/server/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    profile: {
      update: vi.fn(),
    },
    resume: {
      delete: vi.fn(),
    },
    userSkill: {
      deleteMany: vi.fn(),
    },
    experience: {
      deleteMany: vi.fn(),
    },
    education: {
      deleteMany: vi.fn(),
    },
    savedProject: {
      deleteMany: vi.fn(),
    },
    savedDeveloper: {
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(async (cb) => {
      if (typeof cb === 'function') {
        return cb(prisma);
      }
      return Promise.all(cb);
    }),
  },
}));

vi.mock('../../apps/web/src/server/services/configService', () => ({
  getAccountDeletionGraceDays: vi.fn().mockResolvedValue(30),
  enqueueAccountHardDelete: vi.fn().mockResolvedValue(undefined),
  cancelAccountHardDelete: vi.fn().mockResolvedValue(undefined),
}));

describe('Account Deletion & Restoration Service', () => {
  const userId = 'usr_test_123';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(configService.getAccountDeletionGraceDays).mockResolvedValue(30);
  });

  describe('requestAccountDeletion', () => {
    it('throws NotFoundError if user is not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(requestAccountDeletion(userId)).rejects.toThrow(NotFoundError);
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(configService.enqueueAccountHardDelete).not.toHaveBeenCalled();
    });

    it('throws ConflictError if user is already permanently deleted', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: userId,
        status: 'deleted',
      } as any);

      await expect(requestAccountDeletion(userId)).rejects.toThrow(ConflictError);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('returns existing scheduled deletion without duplicate queueing if already pending_deletion', async () => {
      const existingDate = new Date(Date.now() - 86400000 * 5); // 5 days ago
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: userId,
        status: 'pending_deletion',
        deletionRequestedAt: existingDate,
      } as any);

      const res = await requestAccountDeletion(userId);

      expect(res.status).toBe('pending_deletion');
      expect(res.deletionRequestedAt).toEqual(existingDate);
      expect(res.graceDays).toBe(30);
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(configService.enqueueAccountHardDelete).not.toHaveBeenCalled();
    });

    it('sets status to pending_deletion, sets deletionRequestedAt, and enqueues delayed job', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: userId,
        status: 'active',
        deletionRequestedAt: null,
      } as any);

      vi.mocked(prisma.user.update).mockImplementation(async ({ data }: any) => ({
        id: userId,
        status: data.status,
        deletionRequestedAt: data.deletionRequestedAt,
      } as any));

      const res = await requestAccountDeletion(userId);

      expect(res.status).toBe('pending_deletion');
      expect(res.graceDays).toBe(30);
      expect(res.scheduledHardDeleteAt).toBeInstanceOf(Date);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: expect.objectContaining({
          status: 'pending_deletion',
          deletionRequestedAt: expect.any(Date),
        }),
      });
      expect(configService.enqueueAccountHardDelete).toHaveBeenCalledWith(
        userId,
        30 * 24 * 60 * 60 * 1000 // 30 days in ms
      );
    });
  });

  describe('restoreAccount', () => {
    it('throws NotFoundError if user does not exist', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(restoreAccount(userId)).rejects.toThrow(NotFoundError);
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(configService.cancelAccountHardDelete).not.toHaveBeenCalled();
    });

    it('throws ConflictError if user is permanently deleted', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: userId,
        status: 'deleted',
      } as any);

      await expect(restoreAccount(userId)).rejects.toThrow(ConflictError);
    });

    it('returns idempotently if user is already active', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: userId,
        status: 'active',
      } as any);

      const res = await restoreAccount(userId);

      expect(res.status).toBe('active');
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(configService.cancelAccountHardDelete).not.toHaveBeenCalled();
    });

    it('throws ConflictError if grace period has already expired', async () => {
      const expiredDate = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000); // 35 days ago (grace is 30)
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: userId,
        status: 'pending_deletion',
        deletionRequestedAt: expiredDate,
      } as any);

      await expect(restoreAccount(userId)).rejects.toThrow(ConflictError);
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(configService.cancelAccountHardDelete).not.toHaveBeenCalled();
    });

    it('successfully restores account during grace period and cancels pending job', async () => {
      const activePendingDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: userId,
        status: 'pending_deletion',
        deletionRequestedAt: activePendingDate,
      } as any);

      vi.mocked(prisma.user.updateMany).mockResolvedValue({
        count: 1,
      } as any);

      const res = await restoreAccount(userId);

      expect(res.status).toBe('active');
      expect(res.deletionRequestedAt).toBeNull();
      expect(prisma.user.updateMany).toHaveBeenCalledWith({
        where: {
          id: userId,
          status: 'pending_deletion',
        },
        data: {
          status: 'active',
          deletionRequestedAt: null,
        },
      });
      expect(configService.cancelAccountHardDelete).toHaveBeenCalledWith(userId);
    });

    it('throws ConflictError if concurrent hard-delete job deletes the account during restoration race', async () => {
      const activePendingDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      // First read sees pending_deletion
      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce({
          id: userId,
          status: 'pending_deletion',
          deletionRequestedAt: activePendingDate,
        } as any)
        // Second read after updateMany fails sees that account was hard deleted
        .mockResolvedValueOnce({
          id: userId,
          status: 'deleted',
        } as any);

      // Concurrent worker updated status to deleted, so conditional update matches 0 rows
      vi.mocked(prisma.user.updateMany).mockResolvedValue({
        count: 0,
      } as any);

      await expect(restoreAccount(userId)).rejects.toThrow(ConflictError);
      expect(configService.cancelAccountHardDelete).not.toHaveBeenCalled();
    });

    it('handles race where account was already restored and is active when conditional update executes', async () => {
      const activePendingDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce({
          id: userId,
          status: 'pending_deletion',
          deletionRequestedAt: activePendingDate,
        } as any)
        .mockResolvedValueOnce({
          id: userId,
          status: 'active',
        } as any);

      vi.mocked(prisma.user.updateMany).mockResolvedValue({
        count: 0,
      } as any);

      const res = await restoreAccount(userId);

      expect(res.status).toBe('active');
      expect(res.message).toBe('Account is already active');
      expect(configService.cancelAccountHardDelete).not.toHaveBeenCalled();
    });
  });

  describe('getAccountStatus', () => {
    it('returns correct status and computed hard delete date', async () => {
      const reqDate = new Date('2026-10-01T12:00:00Z');
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: userId,
        email: 'user@example.com',
        status: 'pending_deletion',
        deletionRequestedAt: reqDate,
      } as any);

      const res = await getAccountStatus(userId);

      expect(res.id).toBe(userId);
      expect(res.email).toBe('user@example.com');
      expect(res.status).toBe('pending_deletion');
      expect(res.graceDays).toBe(30);
      expect(res.scheduledHardDeleteAt).toEqual(new Date(reqDate.getTime() + 30 * 86400000));
    });
  });
});
