import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitReview } from '../../apps/web/src/server/services/reviewService';
import { prisma } from '../../apps/web/src/server/db';

vi.mock('../../apps/web/src/server/db', () => ({
  prisma: {
    project: { findUnique: vi.fn() },
    projectMember: { findFirst: vi.fn() },
    review: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
  }
}));

vi.mock('@codesync/core/queue', () => ({
  enqueueReviewVisibility: vi.fn()
}));

vi.mock('../../apps/web/src/server/services/configService', () => ({
  getReviewVisibilityWindowDays: vi.fn().mockResolvedValue(14)
}));

vi.mock('../../apps/web/src/server/services/notificationService', () => ({
  createNotification: vi.fn().mockResolvedValue({})
}));

describe('Review Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects review if project is not completed', async () => {
    vi.mocked(prisma.project.findUnique).mockResolvedValue({ id: 'proj-1', status: 'open' } as any);
    
    await expect(submitReview('proj-1', 'user-1', { revieweeId: 'user-2', rating: 5, comment: 'Great' }))
      .rejects.toThrow('Project must be completed');
  });

  it('allows review and schedules delayed visibility if counterpart is missing', async () => {
    vi.mocked(prisma.project.findUnique).mockResolvedValue({ id: 'proj-1', status: 'completed', ownerId: 'user-1' } as any);
    // user-2 is a member
    vi.mocked(prisma.projectMember.findFirst).mockResolvedValue({ userId: 'user-2' } as any);
    vi.mocked(prisma.review.findFirst).mockResolvedValue(null); // No existing review
    vi.mocked(prisma.review.create).mockResolvedValue({ id: 'rev-1', visibleAt: null } as any);

    const review = await submitReview('proj-1', 'user-1', { revieweeId: 'user-2', rating: 4, comment: 'Good' });
    
    expect(review.id).toBe('rev-1');
    const { enqueueReviewVisibility } = await import('@codesync/core/queue');
    expect(enqueueReviewVisibility).toHaveBeenCalledWith('rev-1', 14 * 24 * 60 * 60 * 1000);
  });
});

