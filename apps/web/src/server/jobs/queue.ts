import { Queue } from 'bullmq';
import { NotificationCategory } from '../../lib/validations/notification';

// In a real deployed app, this uses process.env.REDIS_URL
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

export const matchingQueue = new Queue('matching', {
  connection: { url: REDIS_URL }
});

export const notificationQueue = new Queue('notification', {
  connection: { url: REDIS_URL }
});

export const digestQueue = new Queue('digest', {
  connection: { url: REDIS_URL }
});

export async function scheduleWeeklyDigest() {
  try {
    // Run at 9:00 AM every Monday (0 9 * * 1)
    await digestQueue.upsertJobScheduler('weekly-digest', 
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
    await matchingQueue.add('recompute', payload, {
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

    await notificationQueue.add('deliver', payload, opts);
  } catch (error) {
    console.error('Failed to enqueue notification', error);
  }
}
