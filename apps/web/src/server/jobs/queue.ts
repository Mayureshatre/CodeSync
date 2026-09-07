import { Queue } from 'bullmq';

// In a real deployed app, this uses process.env.REDIS_URL
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

export const matchingQueue = new Queue('matching', {
  connection: { url: REDIS_URL }
});

export async function enqueueMatchRecompute(payload: { userId?: string; projectId?: string }) {
  // If no Redis is available during local MVP tests, we can just log or skip
  // But we enqueue it properly to BullMQ for the worker to pick up
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
