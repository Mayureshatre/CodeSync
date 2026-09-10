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

export async function enqueueNotification(payload: NotificationJobPayload) {
  try {
    await notificationQueue.add('deliver', payload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 }, // Transient failures retry
      removeOnComplete: true,
      removeOnFail: false // Keep failed jobs in Redis for debugging
    });
  } catch (error) {
    console.error('Failed to enqueue notification', error);
  }
}
