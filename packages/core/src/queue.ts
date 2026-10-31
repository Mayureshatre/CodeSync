import { Queue } from 'bullmq';
import { NotificationCategory } from './notificationTypes';

// In a real deployed app, this uses process.env.REDIS_URL
export const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// Non-spammy diagnostic logger for development and offline Redis scenarios
let lastRedisErrorLog = 0;
const REDIS_LOG_INTERVAL_MS = 30000; // Log at most once every 30 seconds

export function logRedisDiagnostic(queueName: string, err: any) {
  const now = Date.now();
  if (now - lastRedisErrorLog > REDIS_LOG_INTERVAL_MS) {
    lastRedisErrorLog = now;
    const msg = err?.message || String(err);
    console.warn(
      `[CodeSync Redis Warning] Queue "${queueName}" cannot connect to Redis at ${REDIS_URL} (${msg}). ` +
      `Background jobs (matching recomputations, notifications, digest scheduling, delayed cleanup) ` +
      `are paused until Redis is available. Retrying with exponential backoff...`
    );
  }
}

export const getQueueConnectionOptions = () => ({
  url: REDIS_URL,
  maxRetriesPerRequest: null,
  retryStrategy: (times: number) => {
    // Exponential backoff capped at 30 seconds to prevent tight-loop connection attempts
    return Math.min(times * 1000, 30000);
  },
  connectTimeout: 5000,
});

export function createManagedQueue(name: string): Queue {
  const queue = new Queue(name, {
    connection: getQueueConnectionOptions(),
  });

  // Attach error handler to prevent unhandled EventEmitter error spam and crash
  queue.on('error', (err) => {
    logRedisDiagnostic(name, err);
  });

  return queue;
}

let _matchingQueue: Queue | null = null;
export const getMatchingQueue = () => {
  if (!_matchingQueue) _matchingQueue = createManagedQueue('matching');
  return _matchingQueue;
};

let _notificationQueue: Queue | null = null;
export const getNotificationQueue = () => {
  if (!_notificationQueue) _notificationQueue = createManagedQueue('notification');
  return _notificationQueue;
};

let _digestQueue: Queue | null = null;
export const getDigestQueue = () => {
  if (!_digestQueue) _digestQueue = createManagedQueue('digest');
  return _digestQueue;
};

let _reviewQueue: Queue | null = null;
export const getReviewQueue = () => {
  if (!_reviewQueue) _reviewQueue = createManagedQueue('review');
  return _reviewQueue;
};

let _accountQueue: Queue | null = null;
export const getAccountQueue = () => {
  if (!_accountQueue) _accountQueue = createManagedQueue('account');
  return _accountQueue;
};

export function resetQueuesForTesting() {
  _matchingQueue = null;
  _notificationQueue = null;
  _digestQueue = null;
  _reviewQueue = null;
  _accountQueue = null;
}

export const QUEUE_OP_TIMEOUT_MS = 2000;

export async function withQueueTimeout<T>(promise: Promise<T>, opName: string): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`${opName} timed out after ${QUEUE_OP_TIMEOUT_MS}ms. Redis server at ${REDIS_URL} is likely unreachable.`));
    }, QUEUE_OP_TIMEOUT_MS);
    timer.unref?.();
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function scheduleWeeklyDigest() {
  try {
    // Run at 9:00 AM every Monday (0 9 * * 1)
    await withQueueTimeout(
      getDigestQueue().upsertJobScheduler('weekly-digest', 
        { pattern: '0 9 * * 1' },
        {
          name: 'weekly-digest',
          data: {},
          opts: { removeOnComplete: true }
        }
      ),
      'scheduleWeeklyDigest'
    );
  } catch (error) {
    logRedisDiagnostic('digest', error);
  }
}

export async function enqueueMatchRecompute(payload: { userId?: string; projectId?: string }) {
  try {
    await withQueueTimeout(
      getMatchingQueue().add('recompute', payload, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: true
      }),
      'enqueueMatchRecompute'
    );
  } catch (error) {
    logRedisDiagnostic('matching', error);
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

    await withQueueTimeout(
      getNotificationQueue().add('deliver', payload, opts),
      'enqueueNotification'
    );
  } catch (error) {
    logRedisDiagnostic('notification', error);
  }
}

export async function enqueueReviewVisibility(reviewId: string, delayMs: number) {
  try {
    await withQueueTimeout(
      getReviewQueue().add('reveal-review', { reviewId }, {
        delay: delayMs,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
        jobId: `reveal-review-${reviewId}`
      }),
      'enqueueReviewVisibility'
    );
  } catch (error) {
    logRedisDiagnostic('review', error);
  }
}

export async function enqueueAccountHardDelete(userId: string, delayMs: number) {
  try {
    const queue = getAccountQueue();
    const jobId = `account-hard-delete:${userId}`;

    try {
      const existing = await withQueueTimeout(queue.getJob(jobId), 'getJob(account-hard-delete)');
      if (existing) {
        await withQueueTimeout(existing.remove(), 'removeJob(account-hard-delete)');
      }
    } catch {
      // Ignore if job does not exist or timed out
    }

    await withQueueTimeout(
      queue.add('hard-delete', { userId }, {
        delay: delayMs,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
        jobId
      }),
      'enqueueAccountHardDelete'
    );
  } catch (error) {
    logRedisDiagnostic('account', error);
  }
}

export async function cancelAccountHardDelete(userId: string) {
  try {
    const queue = getAccountQueue();
    const jobId = `account-hard-delete:${userId}`;
    const job = await withQueueTimeout(queue.getJob(jobId), 'getJob(cancel-hard-delete)');
    if (job) {
      await withQueueTimeout(job.remove(), 'removeJob(cancel-hard-delete)');
    }
  } catch (error) {
    logRedisDiagnostic('account', error);
  }
}
