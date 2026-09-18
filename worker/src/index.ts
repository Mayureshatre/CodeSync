import { Worker } from 'bullmq';
import { startNotificationWorker } from './notificationWorker';
import { startDigestWorker } from './digestWorker';
import { startReviewWorker } from './reviewWorker';
import { scheduleWeeklyDigest } from '@codesync/core/queue';
import { recomputeAndPersistMatch, recomputeAllForUser, recomputeAllForProject } from '@codesync/core/matchingService';

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const matchingWorker = new Worker('matching', async (job) => {
  console.log(`[MatchingWorker] Processing match recompute job ${job.id}`, job.data);
  const { userId, projectId } = job.data;

  if (userId && projectId) {
    // Single-pair recompute: existing function is already optimal (two targeted findUnique calls)
    await recomputeAndPersistMatch(userId, projectId);
  } else if (userId) {
    // All projects for a user: fetch user once, iterate projects in memory
    await recomputeAllForUser(userId);
  } else if (projectId) {
    // All users for a project: fetch project once, iterate users in memory
    await recomputeAllForProject(projectId);
  }
}, { connection: { url: REDIS_URL } });

matchingWorker.on('failed', (job, err) => {
  console.error(`[MatchingWorker] Job ${job?.id} failed:`, err);
});

// Start the workers
const notificationWorker = startNotificationWorker(REDIS_URL);
const digestWorker = startDigestWorker(REDIS_URL);
const reviewWorker = startReviewWorker(REDIS_URL);

// Schedule the recurring job
scheduleWeeklyDigest().catch(console.error);

console.log('Workers are running...');

// Graceful shutdown
async function gracefulShutdown(signal: string) {
  console.log(`Received ${signal}, closing workers gracefully...`);
  await Promise.all([
    matchingWorker.close(),
    notificationWorker.close(),
    digestWorker.close(),
    reviewWorker.close()
  ]);
  console.log('Workers closed successfully.');
  process.exit(0);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
