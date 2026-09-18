import { Queue } from 'bullmq';
import { NotificationCategory } from './notificationTypes';

// In a real deployed app, this uses process.env.REDIS_URL
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

let _matchingQueue: Queue | null = null;
export const getMatchingQueue = () => {
  if (!_matchingQueue) _matchingQueue = new Queue('matching', { connection: { url: REDIS_URL } });
  return _matchingQueue;
};

let _notificationQueue: Queue | null = null;
export const getNotificationQueue = () => {
  if (!_notificationQueue) _notificationQueue = new Queue('notification', { connection: { url: REDIS_URL } });
  return _notificationQueue;
};

let _digestQueue: Queue | null = null;
export const getDigestQueue = () => {
  if (!_digestQueue) _digestQueue = new Queue('digest', { connection: { url: REDIS_URL } });
  return _digestQueue;
};

let _reviewQueue: Queue | null = null;
export const getReviewQueue = () => {
  if (!_reviewQueue) _reviewQueue = new Queue('review', { connection: { url: REDIS_URL } });
  return _reviewQueue;
};

export async function scheduleWeeklyDigest() {
  try {
    // Run at 9:00 AM every Monday (0 9 * * 1)
    await getDigestQueue().upsertJobScheduler('weekly-digest', 
      { pattern: '0 9 * * 1' },
      {
        name: 'weekly-digest',
        data: {},
        opts: { removeOnComplete: true }
      }
    );
  } catch (error) {
    console.error('Failed to schedule weekly digest', error);
  }
}

export async function enqueueMatchRecompute(payload: { userId?: string; projectId?: string }) {
  try {
    await getMatchingQueue().add('recompute', payload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: true
    });
  } catch (error) {
    console.error('Failed to enqueue match recompute', error);
  }
}

export type NotificationJobPayload = {
  notificationId: string;
  userId: string;
  category: NotificationCategory;
  payload: any;
};

export async function enqueueNotification(payload: NotificationJobPayload, jobId?: string) {
  try {
    const opts: any = {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 }, // Transient failures retry
      removeOnFail: false // Keep failed jobs in Redis for debugging
    };

    if (jobId) {
      opts.jobId = jobId;
      // Retain completed digest jobs in Redis for 7 days (604800s) for deduplication
      opts.removeOnComplete = { age: 604800 }; 
    } else {
      opts.removeOnComplete = true;
    }

    await getNotificationQueue().add('deliver', payload, opts);
  } catch (error) {
    console.error('Failed to enqueue notification', error);
  }
}

export async function enqueueReviewVisibility(reviewId: string, delayMs: number) {
  try {
    await getReviewQueue().add('reveal-review', { reviewId }, {
      delay: delayMs,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: true,
      jobId: `reveal-review-${reviewId}`
    });
  } catch (error) {
    console.error('Failed to enqueue review visibility', error);
  }
}



