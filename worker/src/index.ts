import { Worker } from 'bullmq';
import { processMatchingJob } from './matchingWorker';
import { startNotificationWorker } from './notificationWorker';
import { startDigestWorker } from './digestWorker';
import { startReviewWorker } from './reviewWorker';
import { startAccountWorker } from './accountWorker';
import { scheduleWeeklyDigest } from '@codesync/core/queue';
import { validateEnv } from '@codesync/core/env';
import { sanitizeErrorMessage } from './utils';

validateEnv();

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

console.log('[WorkerBootstrap] Starting CodeSync background worker service...');

const matchingWorker = new Worker('matching', processMatchingJob, { connection: { url: REDIS_URL } });

matchingWorker.on('failed', (job, err) => {
  console.error(`[MatchingWorker] Job ${job?.id} failed:`, sanitizeErrorMessage(err?.message || String(err)));
});

matchingWorker.on('error', (err) => {
  console.error(`[MatchingWorker] Connection error:`, sanitizeErrorMessage(err?.message || String(err)));
});

// Start the workers
const notificationWorker = startNotificationWorker(REDIS_URL);
const digestWorker = startDigestWorker(REDIS_URL);
const reviewWorker = startReviewWorker(REDIS_URL);
const accountWorker = startAccountWorker(REDIS_URL);

// Graceful shutdown
async function gracefulShutdown(signal: string, exitCode = 0) {
  console.log(`[WorkerBootstrap] Received ${signal}, closing workers gracefully...`);
  await Promise.allSettled([
    matchingWorker.close(),
    notificationWorker.close(),
    digestWorker.close(),
    reviewWorker.close(),
    accountWorker.close()
  ]);
  console.log('[WorkerBootstrap] Workers closed successfully.');
  process.exit(exitCode);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

async function start() {
  console.log('[WorkerBootstrap] Connecting to Redis and awaiting worker readiness...');

  const STARTUP_TIMEOUT_MS = 20000;
  let timeoutId: NodeJS.Timeout | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Timed out after ${STARTUP_TIMEOUT_MS}ms waiting for Redis connection and worker readiness.`));
    }, STARTUP_TIMEOUT_MS);
    timeoutId.unref?.();
  });

  try {
    await Promise.race([
      Promise.all([
        matchingWorker.waitUntilReady().then(() => {
          console.log('[MatchingWorker] Redis connection established. Ready to process jobs.');
        }),
        notificationWorker.waitUntilReady().then(() => {
          console.log('[NotificationWorker] Redis connection established. Ready to process jobs.');
        }),
        digestWorker.waitUntilReady().then(() => {
          console.log('[DigestWorker] Redis connection established. Ready to process jobs.');
        }),
        reviewWorker.waitUntilReady().then(() => {
          console.log('[ReviewWorker] Redis connection established. Ready to process jobs.');
        }),
        accountWorker.waitUntilReady().then(() => {
          console.log('[AccountWorker] Redis connection established. Ready to process jobs.');
        }),
      ]),
      timeoutPromise
    ]);

    if (timeoutId) clearTimeout(timeoutId);

    // Schedule the recurring job after workers are ready
    await scheduleWeeklyDigest();
    console.log('[WorkerBootstrap] Weekly digest scheduler initialized.');

    console.log('Workers are running and all 5 queues are ready to process jobs.');
  } catch (error: any) {
    if (timeoutId) clearTimeout(timeoutId);
    console.error('[WorkerBootstrap] Fatal startup error during worker readiness handshake:', sanitizeErrorMessage(error?.message || String(error)));
    await gracefulShutdown('STARTUP_FAILURE', 1);
  }
}

start();
