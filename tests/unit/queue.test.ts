import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getQueueConnectionOptions,
  logRedisDiagnostic,
  withQueueTimeout,
  QUEUE_OP_TIMEOUT_MS,
  enqueueMatchRecompute,
  enqueueNotification,
  getMatchingQueue,
  resetQueuesForTesting
} from '@codesync/core/queue';

describe('Queue Module & Redis Diagnostics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetQueuesForTesting();
  });

  afterEach(() => {
    resetQueuesForTesting();
  });

  it('provides bounded exponential backoff in retryStrategy', () => {
    const opts = getQueueConnectionOptions();
    expect(opts.url).toBeDefined();
    expect(opts.maxRetriesPerRequest).toBeNull();
    expect(typeof opts.retryStrategy).toBe('function');

    const retryStrategy = opts.retryStrategy;
    expect(retryStrategy(1)).toBe(1000);
    expect(retryStrategy(5)).toBe(5000);
    expect(retryStrategy(30)).toBe(30000);
    expect(retryStrategy(100)).toBe(30000); // capped at 30000ms
  });

  it('throttles redis diagnostic warnings to avoid log spam', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    logRedisDiagnostic('matching', new Error('connect ECONNREFUSED 127.0.0.1:6379'));
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain('[CodeSync Redis Warning]');
    expect(warnSpy.mock.calls[0][0]).toContain('matching');

    // Immediate second call should be throttled
    logRedisDiagnostic('matching', new Error('connect ECONNREFUSED 127.0.0.1:6379'));
    expect(warnSpy).toHaveBeenCalledTimes(1);

    warnSpy.mockRestore();
  });

  it('withQueueTimeout resolves fast promises successfully', async () => {
    const fastPromise = Promise.resolve('ok');
    const result = await withQueueTimeout(fastPromise, 'testOp');
    expect(result).toBe('ok');
  });

  it('withQueueTimeout rejects when the queue operation hangs', async () => {
    vi.useFakeTimers();
    const hangingPromise = new Promise((resolve) => {
      // never resolves
    });

    const timeoutPromise = withQueueTimeout(hangingPromise, 'hangingOp');
    vi.advanceTimersByTime(QUEUE_OP_TIMEOUT_MS + 100);

    await expect(timeoutPromise).rejects.toThrow(/hangingOp timed out after 2000ms/);
    vi.useRealTimers();
  });

  it('enqueueMatchRecompute catches timeout / connection errors gracefully without crashing caller', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // getMatchingQueue returns a queue whose add will time out or reject
    const queue = getMatchingQueue();
    const addSpy = vi.spyOn(queue, 'add').mockImplementation(() => {
      return Promise.reject(new Error('Connection closed'));
    });

    await expect(enqueueMatchRecompute({ userId: 'u1' })).resolves.not.toThrow();
    expect(addSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
    addSpy.mockRestore();
  });

  it('enqueueNotification catches errors gracefully without throwing', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const queue = (await import('@codesync/core/queue')).getNotificationQueue();
    const addSpy = vi.spyOn(queue, 'add').mockImplementation(() => {
      return Promise.reject(new Error('ECONNREFUSED'));
    });

    await expect(
      enqueueNotification({
        notificationId: 'n1',
        userId: 'u1',
        category: 'MATCH_FOUND' as any,
        payload: {}
      })
    ).resolves.not.toThrow();

    expect(addSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
    addSpy.mockRestore();
  });
});
