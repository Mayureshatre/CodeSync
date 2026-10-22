import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requestPasswordReset, resetPassword, hashPasswordResetToken } from '../../apps/web/src/server/services/authService';
import { prisma } from '../../apps/web/src/server/db';
import { getEmailTransport } from '../../apps/web/src/server/services/emailTransport';
import { AuthenticationError, NotFoundError } from '../../apps/web/src/server/errors';
import bcrypt from 'bcryptjs';

vi.mock('../../apps/web/src/server/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    verificationToken: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn((cb) => (Array.isArray(cb) ? Promise.all(cb) : cb(prisma))),
  },
}));

vi.mock('../../apps/web/src/server/services/emailTransport', () => ({
  getEmailTransport: vi.fn(),
}));

describe('Password Reset Service', () => {
  const mockSendEmail = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getEmailTransport).mockReturnValue({
      sendEmail: mockSendEmail,
    } as any);
  });

  describe('requestPasswordReset', () => {
    it('silently ignores non-existent user to prevent enumeration', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await requestPasswordReset('unknown@example.com');

      expect(prisma.verificationToken.create).not.toHaveBeenCalled();
      expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it('silently ignores OAuth users', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        email: 'oauth@example.com',
        authProvider: 'google',
        status: 'active',
      } as any);

      await requestPasswordReset('oauth@example.com');

      expect(prisma.verificationToken.create).not.toHaveBeenCalled();
      expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it('enforces rate limit if requested less than 60s ago', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        authProvider: 'credentials',
        status: 'active',
      } as any);

      vi.mocked(prisma.verificationToken.findFirst).mockResolvedValue({
        id: 'tok-1',
        createdAt: new Date(), // Just now
      } as any);

      await requestPasswordReset('test@example.com');

      expect(prisma.verificationToken.create).not.toHaveBeenCalled();
      expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it('generates hashed token in DB and sends raw token via email', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        authProvider: 'credentials',
        status: 'active',
      } as any);

      vi.mocked(prisma.verificationToken.findFirst).mockResolvedValue(null);

      await requestPasswordReset('test@example.com');

      expect(prisma.verificationToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'test@example.com',
          token: expect.stringMatching(/^pwd_[a-f0-9]{64}$/),
        }),
      });

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: expect.stringContaining('Reset your CodeSync password'),
          textBody: expect.stringContaining('/auth/reset-password?token='),
        })
      );
    });
  });

  describe('resetPassword', () => {
    const rawToken = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    const hashedToken = hashPasswordResetToken(rawToken);

    it('throws AuthenticationError if token does not exist', async () => {
      vi.mocked(prisma.verificationToken.findUnique).mockResolvedValue(null);

      await expect(resetPassword(rawToken, 'NewPass123!')).rejects.toThrow(AuthenticationError);
    });

    it('throws AuthenticationError and deletes token if token has expired', async () => {
      vi.mocked(prisma.verificationToken.findUnique).mockResolvedValue({
        id: 'tok-1',
        token: hashedToken,
        email: 'test@example.com',
        expiresAt: new Date(Date.now() - 10000), // Expired
      } as any);

      await expect(resetPassword(rawToken, 'NewPass123!')).rejects.toThrow(AuthenticationError);
      expect(prisma.verificationToken.delete).toHaveBeenCalledWith({ where: { id: 'tok-1' } });
    });

    it('updates password, increments sessionVersion, and deletes single-use token', async () => {
      vi.mocked(prisma.verificationToken.findUnique).mockResolvedValue({
        id: 'tok-1',
        token: hashedToken,
        email: 'test@example.com',
        expiresAt: new Date(Date.now() + 60000), // Valid
      } as any);

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        sessionVersion: 1,
      } as any);

      vi.mocked(prisma.user.update).mockResolvedValue({ id: 'user-1' } as any);
      vi.mocked(prisma.verificationToken.delete).mockResolvedValue({ id: 'tok-1' } as any);

      const result = await resetPassword(rawToken, 'BrandNewPassword123!');

      expect(result.success).toBe(true);

      // Verify user updated with new password hash and incremented sessionVersion
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: expect.objectContaining({
          sessionVersion: { increment: 1 },
          passwordHash: expect.any(String),
        }),
      });

      // Verify token is deleted to prevent reuse
      expect(prisma.verificationToken.delete).toHaveBeenCalledWith({
        where: { id: 'tok-1' },
      });
    });

    it('rejects short passwords under 8 characters', async () => {
      await expect(resetPassword(rawToken, 'short')).rejects.toThrow(AuthenticationError);
    });
  });
});
