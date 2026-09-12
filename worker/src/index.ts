import { Worker } from 'bullmq';
import { startNotificationWorker } from './notificationWorker';
import { startDigestWorker } from './digestWorker';
import { scheduleWeeklyDigest } from '../../apps/web/src/server/jobs/queue';

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const matchingWorker = new Worker('matching', async (job: any) => {
  console.log('Processing match recompute job', job.data);
  // In a real environment, this imports matchingService and recomputes
}, { connection: { url: REDIS_URL } });

matchingWorker.on('completed', (job: any) => {
  console.log(`${job.id} has completed!`);
});

matchingWorker.on('failed', (job: any, err: any) => {
  console.log(`${job?.id} has failed with ${err.message}`);
});

// Start the workers
const notificationWorker = startNotificationWorker(REDIS_URL);
const digestWorker = startDigestWorker(REDIS_URL);

// Schedule the recurring job (safe to call multiple times, BullMQ dedups by pattern)
scheduleWeeklyDigest().catch(console.error);

console.log('Workers are running...');
