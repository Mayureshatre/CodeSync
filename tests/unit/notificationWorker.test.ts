import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processNotificationJob } from '../../worker/src/notificationWorker';
import { getPreferences, createNotification } from '@codesync/core/notificationService';
import { getEmailTransport, EmailTransport, EmailPayload } from '@codesync/core/emailTransport';
import { prisma } from '@codesync/core/db';
import { Job } from 'bullmq';

vi.mock('@codesync/core/notificationService', () => ({
  getPreferences: vi.fn(),
  createNotification: vi.fn(),
}));

vi.mock('@codesync/core/emailTransport', () => ({
  getEmailTransport: vi.fn(),
}));

vi.mock('@codesync/core/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

describe('Notification Worker - processNotificationJob', () => {
  let mockTransport: { sendEmail: any };

  beforeEach(() => {
    vi.clearAllMocks();
    mockTransport = {
      sendEmail: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(getEmailTransport).mockReturnValue(mockTransport as unknown as EmailTransport);
  });

  const createJob = (data: any) => ({ data } as Job<any>);

  it('skips email if user preference has EMAIL disabled', async () => {
    vi.mocked(getPreferences).mockResolvedValueOnce({
      PROJECT_MATCH: { EMAIL: false, IN_APP: true },
    } as any);

    await processNotificationJob(createJob({ notificationId: 'n1', userId: 'u1', category: 'PROJECT_MATCH', payload: {} }));

    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(mockTransport.sendEmail).not.toHaveBeenCalled();
  });

  it('skips email if user is not found or has no email', async () => {
    vi.mocked(getPreferences).mockResolvedValueOnce({
      PROJECT_MATCH: { EMAIL: true, IN_APP: true },
    } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

    await processNotificationJob(createJob({ notificationId: 'n1', userId: 'u1', category: 'PROJECT_MATCH', payload: {} }));

    expect(mockTransport.sendEmail).not.toHaveBeenCalled();
  });

  it('sends email successfully', async () => {
    vi.mocked(getPreferences).mockResolvedValueOnce({
      PROJECT_MATCH: { EMAIL: true, IN_APP: true },
    } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ email: 'test@example.com' } as any);

    await processNotificationJob(createJob({ notificationId: 'n1', userId: 'u1', category: 'PROJECT_MATCH', payload: { matchScore: 90 } }));

    expect(mockTransport.sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'test@example.com',
      subject: 'New Notification: PROJECT_MATCH',
    }));
    expect(createNotification).not.toHaveBeenCalled(); // No failure
  });

  it('throws error for transient failures to trigger BullMQ retry', async () => {
    vi.mocked(getPreferences).mockResolvedValueOnce({
      PROJECT_MATCH: { EMAIL: true, IN_APP: true },
    } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ email: 'test@example.com' } as any);
    
    const timeoutError = new Error('Connection timeout');
    mockTransport.sendEmail.mockRejectedValueOnce(timeoutError);

    await expect(
      processNotificationJob(createJob({ notificationId: 'n1', userId: 'u1', category: 'PROJECT_MATCH', payload: {} }))
    ).rejects.toThrow('Connection timeout');

    expect(createNotification).not.toHaveBeenCalled(); // Should not create SYSTEM notification yet
  });

  it('handles permanent failures gracefully by creating a SYSTEM notification', async () => {
    vi.mocked(getPreferences).mockResolvedValueOnce({
      PROJECT_MATCH: { EMAIL: true, IN_APP: true },
      SYSTEM: { IN_APP: true, EMAIL: true }
    } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ email: 'bounce@example.com' } as any);
    
    const bounceError = new Error('Recipient address bounced');
    mockTransport.sendEmail.mockRejectedValueOnce(bounceError);

    await processNotificationJob(createJob({ notificationId: 'n1', userId: 'u1', category: 'PROJECT_MATCH', payload: {} }));

    // Does not throw (so it doesn't retry)
    // BUT creates a SYSTEM notification
    expect(createNotification).toHaveBeenCalledWith('u1', 'SYSTEM', {
      event: 'EMAIL_DELIVERY_FAILED',
      category: 'PROJECT_MATCH',
      reason: 'Recipient address bounced',
      originalNotificationId: 'n1'
    });
  });

  it('skips SYSTEM fallback creation if SYSTEM IN_APP preference is disabled', async () => {
    vi.mocked(getPreferences).mockResolvedValueOnce({
      PROJECT_MATCH: { EMAIL: true, IN_APP: true },
      SYSTEM: { IN_APP: false, EMAIL: true }
    } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ email: 'bounce@example.com' } as any);
    
    const bounceError = new Error('Recipient address bounced');
    mockTransport.sendEmail.mockRejectedValueOnce(bounceError);

    await processNotificationJob(createJob({ notificationId: 'n1', userId: 'u1', category: 'PROJECT_MATCH', payload: {} }));

    expect(createNotification).not.toHaveBeenCalled();
  });
});
