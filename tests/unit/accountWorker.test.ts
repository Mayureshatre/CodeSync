import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@codesync/core/db';
import * as configService from '@codesync/core/configService';
import { processAccountHardDeleteJob } from '../../worker/src/accountWorker';
import { Job } from 'bullmq';

vi.mock('@codesync/core/db', () => ({
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

vi.mock('@codesync/core/configService', () => ({
  getAccountDeletionGraceDays: vi.fn().mockResolvedValue(30),
}));

describe('Account Worker - processAccountHardDeleteJob', () => {
  const createJob = (data: { userId: string }) => ({ data, name: 'hard-delete' } as Job<{ userId: string }>);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(configService.getAccountDeletionGraceDays).mockResolvedValue(30);
    vi.mocked(prisma.user.updateMany).mockResolvedValue({ count: 1 } as any);
  });

  it('skips execution if user is not found', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    await processAccountHardDeleteJob(createJob({ userId: 'usr_none' }));

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('skips execution if user status is active or already deleted (idempotency guard)', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'usr_active',
      status: 'active',
    } as any);

    await processAccountHardDeleteJob(createJob({ userId: 'usr_active' }));

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('skips execution if grace period has not expired yet', async () => {
    const recentDate = new Date(Date.now() - 5 * 86400000); // requested 5 days ago (grace is 30)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'usr_pending',
      status: 'pending_deletion',
      deletionRequestedAt: recentDate,
    } as any);

    await processAccountHardDeleteJob(createJob({ userId: 'usr_pending' }));

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('aborts hard-delete transaction if user was restored concurrently (updateMany count = 0)', async () => {
    const expiredDate = new Date(Date.now() - 31 * 86400000);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'usr_concurrent',
      status: 'pending_deletion',
      deletionRequestedAt: expiredDate,
      profile: { id: 'prof_concurrent', displayName: 'John' },
    } as any);

    // Simulate concurrent restore having updated status to 'active'
    vi.mocked(prisma.user.updateMany).mockResolvedValue({ count: 0 } as any);

    await processAccountHardDeleteJob(createJob({ userId: 'usr_concurrent' }));

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.profile.update).not.toHaveBeenCalled();
    expect(prisma.userSkill.deleteMany).not.toHaveBeenCalled();
  });

  it('executes anonymization, removes resume, and sets status to deleted when grace period expired', async () => {
    const expiredDate = new Date(Date.now() - 31 * 86400000); // requested 31 days ago
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'usr_ready_for_deletion',
      status: 'pending_deletion',
      deletionRequestedAt: expiredDate,
      profile: { id: 'prof_123', displayName: 'Jane Doe' },
      resume: { id: 'res_123', fileUrl: 'https://s3.local/resume.pdf' },
    } as any);

    await processAccountHardDeleteJob(createJob({ userId: 'usr_ready_for_deletion' }));

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'usr_ready_for_deletion',
        status: 'pending_deletion',
      },
      data: expect.objectContaining({
        email: 'deleted_usr_ready_for_deletion@deleted.local',
        passwordHash: null,
        status: 'deleted',
        deletionRequestedAt: null,
      }),
    });

    expect(prisma.profile.update).toHaveBeenCalledWith({
      where: { id: 'prof_123' },
      data: expect.objectContaining({
        displayName: 'Former Collaborator',
        bio: null,
        profileVisibility: 'unlisted',
        availability: 'not_looking',
      }),
    });

    expect(prisma.resume.delete).toHaveBeenCalledWith({
      where: { id: 'res_123' },
    });

    expect(prisma.userSkill.deleteMany).toHaveBeenCalledWith({ where: { userId: 'usr_ready_for_deletion' } });
    expect(prisma.experience.deleteMany).toHaveBeenCalledWith({ where: { userId: 'usr_ready_for_deletion' } });
    expect(prisma.education.deleteMany).toHaveBeenCalledWith({ where: { userId: 'usr_ready_for_deletion' } });
    expect(prisma.savedProject.deleteMany).toHaveBeenCalledWith({ where: { userId: 'usr_ready_for_deletion' } });
    expect(prisma.savedDeveloper.deleteMany).toHaveBeenCalledWith({ where: { userId: 'usr_ready_for_deletion' } });
  });
});
