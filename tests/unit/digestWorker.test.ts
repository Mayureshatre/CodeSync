import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processDigestJob, getWeekIdentifier } from '../../worker/src/digestWorker';
import { prisma } from '@codesync/core/db';
import { getPreferences, createNotification } from '@codesync/core/notificationService';
import { enqueueNotification } from '@codesync/core/queue';
import { Job } from 'bullmq';

vi.mock('@codesync/core/db', () => ({
  prisma: {
    recommendation: { findMany: vi.fn() },
    notification: { findMany: vi.fn(), create: vi.fn() }
  }
}));

vi.mock('@codesync/core/notificationService', () => ({
  getPreferences: vi.fn(),
  createNotification: vi.fn()
}));

vi.mock('@codesync/core/queue', () => ({
  enqueueNotification: vi.fn()
}));

describe('Digest Worker', () => {
  const dummyJob = { id: 'digest-1' } as Job;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates a correct week identifier format', () => {
    const weekStr = getWeekIdentifier(new Date('2023-10-18T12:00:00Z')); // Week 42
    expect(weekStr).toMatch(/^\d{4}-W\d{2}$/);
    expect(weekStr).toBe('2023-W42');
  });

  it('exits cleanly if no recent recommendations found', async () => {
    vi.mocked(prisma.recommendation.findMany).mockResolvedValueOnce([]);
    
    await processDigestJob(dummyJob);
    
    expect(getPreferences).not.toHaveBeenCalled();
    expect(enqueueNotification).not.toHaveBeenCalled();
  });

  it('skips users who opted out of both PROJECT_MATCH IN_APP and EMAIL', async () => {
    vi.mocked(prisma.recommendation.findMany).mockResolvedValueOnce([
      { userId: 'u1', targetId: 'p1', targetType: 'project', surfacedAt: new Date(), dismissedAt: null, id: 'r1' }
    ]);
    // User opted out of both
    vi.mocked(getPreferences).mockResolvedValueOnce({
      PROJECT_MATCH: { EMAIL: false, IN_APP: false }
    } as any);

    await processDigestJob(dummyJob);

    expect(prisma.notification.findMany).not.toHaveBeenCalled();
    expect(createNotification).not.toHaveBeenCalled();
    expect(enqueueNotification).not.toHaveBeenCalled();
  });

  it('skips user if digest was already sent this week (IN_APP deduplication)', async () => {
    vi.mocked(prisma.recommendation.findMany).mockResolvedValueOnce([
      { userId: 'u1', targetId: 'p1', targetType: 'project', surfacedAt: new Date(), dismissedAt: null, id: 'r1' }
    ]);
    vi.mocked(getPreferences).mockResolvedValueOnce({
      PROJECT_MATCH: { EMAIL: true, IN_APP: true }
    } as any);

    // Mock existing in-app digest
    const weekIdentifier = getWeekIdentifier();
    vi.mocked(prisma.notification.findMany).mockResolvedValueOnce([
      { 
        id: 'n1', userId: 'u1', type: 'PROJECT_MATCH', 
        payload: { event: 'weekly_digest', week: weekIdentifier },
        readAt: null, createdAt: new Date()
      }
    ]);

    await processDigestJob(dummyJob);

    expect(createNotification).not.toHaveBeenCalled();
    expect(enqueueNotification).not.toHaveBeenCalled();
  });

  it('creates in-app notification and enqueues digest email when both are enabled', async () => {
    vi.mocked(prisma.recommendation.findMany).mockResolvedValueOnce([
      { userId: 'u1', targetId: 'p1', targetType: 'project', surfacedAt: new Date(), dismissedAt: null, id: 'r1' }
    ]);
    vi.mocked(getPreferences).mockResolvedValueOnce({
      PROJECT_MATCH: { EMAIL: true, IN_APP: true }
    } as any);
    vi.mocked(prisma.notification.findMany).mockResolvedValueOnce([]);
    vi.mocked(createNotification).mockResolvedValueOnce({ id: 'n-new' } as any);

    await processDigestJob(dummyJob);

    const weekIdentifier = getWeekIdentifier();
    expect(createNotification).toHaveBeenCalled();
    expect(enqueueNotification).toHaveBeenCalledWith(expect.objectContaining({
      notificationId: 'n-new',
      userId: 'u1'
    }), `digest-u1-${weekIdentifier}`);
  });

  it('skips in-app notification but enqueues email when IN_APP is disabled and EMAIL is enabled', async () => {
    vi.mocked(prisma.recommendation.findMany).mockResolvedValueOnce([
      { userId: 'u2', targetId: 'p2', targetType: 'project', surfacedAt: new Date(), dismissedAt: null, id: 'r2' }
    ]);
    vi.mocked(getPreferences).mockResolvedValueOnce({
      PROJECT_MATCH: { EMAIL: true, IN_APP: false }
    } as any);

    await processDigestJob(dummyJob);

    const weekIdentifier = getWeekIdentifier();
    expect(prisma.notification.findMany).not.toHaveBeenCalled();
    expect(createNotification).not.toHaveBeenCalled();
    expect(enqueueNotification).toHaveBeenCalledWith(expect.objectContaining({
      notificationId: `email-only-digest-u2-${weekIdentifier}`,
      userId: 'u2'
    }), `digest-u2-${weekIdentifier}`);
  });
});
