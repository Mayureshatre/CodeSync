import { Worker, Job } from 'bullmq';
import { prisma } from '../../apps/web/src/server/db';
import { getPreferences, createNotification } from '../../apps/web/src/server/services/notificationService';
import { enqueueNotification } from '../../apps/web/src/server/jobs/queue';

// Get ISO week string, e.g., "2023-W42"
export function getWeekIdentifier(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
}

export async function processDigestJob(job: Job) {
  console.log(`[DigestWorker] Starting weekly digest processing (Job: ${job.id})`);
  const weekIdentifier = getWeekIdentifier();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // 1. Find all users who received new project recommendations in the last 7 days
  const recentRecommendations = await prisma.recommendation.findMany({
    where: {
      targetType: 'project',
      surfacedAt: {
        gte: sevenDaysAgo
      }
    },
    select: {
      userId: true,
      targetId: true
    }
  });

  if (recentRecommendations.length === 0) {
    console.log('[DigestWorker] No new recommendations to digest.');
    return;
  }

  // Group by user
  const userMatches = recentRecommendations.reduce((acc, rec) => {
    if (!acc[rec.userId]) acc[rec.userId] = [];
    acc[rec.userId]!.push(rec.targetId);
    return acc;
  }, {} as Record<string, string[]>);

  let sentCount = 0;
  let skippedCount = 0;

  // 2. Process each user
  for (const [userId, projectIds] of Object.entries(userMatches)) {
    try {
      const prefs = await getPreferences(userId);
      const emailEnabled = prefs['PROJECT_MATCH']?.['EMAIL'] ?? true;
      const inAppEnabled = prefs['PROJECT_MATCH']?.['IN_APP'] ?? true;
      
      if (!emailEnabled && !inAppEnabled) {
        skippedCount++;
        continue;
      }

      const jobId = `digest-${userId}-${weekIdentifier}`;
      let notificationId = `email-only-${jobId}`;

      // In-app deduplication and creation
      if (inAppEnabled) {
        const recentNotifications = await prisma.notification.findMany({
          where: { userId, type: 'PROJECT_MATCH', createdAt: { gte: sevenDaysAgo } }
        });

        const alreadySentThisWeek = recentNotifications.some(n => {
          const p = n.payload as any;
          return p?.event === 'weekly_digest' && p?.week === weekIdentifier;
        });

        if (alreadySentThisWeek) {
          skippedCount++;
          continue;
        }

        const notification = await createNotification(userId, 'PROJECT_MATCH', {
          event: 'weekly_digest',
          week: weekIdentifier,
          matchCount: projectIds.length,
          projectIds
        });
        notificationId = notification.id;
      }

      if (emailEnabled) {
        await enqueueNotification({
          notificationId,
          userId,
          category: 'PROJECT_MATCH',
          payload: {
            event: 'weekly_digest',
            week: weekIdentifier,
            matchCount: projectIds.length
          }
        }, jobId);
      }
      
      sentCount++;
    } catch (error) {
      console.error(`[DigestWorker] Failed to process user ${userId}`, error);
    }
  }

  console.log(`[DigestWorker] Completed. Sent: ${sentCount}, Skipped/Deduped: ${skippedCount}`);
}

export function startDigestWorker(redisUrl: string) {
  const worker = new Worker('digest', processDigestJob, { 
    connection: { url: redisUrl },
    concurrency: 1
  });

  worker.on('failed', (job, err) => {
    console.error(`[DigestWorker] Job ${job?.id} failed:`, err);
  });

  return worker;
}
