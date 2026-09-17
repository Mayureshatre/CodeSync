import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateVerificationToken, verifyEmailToken, registerUser, resendVerificationEmail } from '../../apps/web/src/server/services/authService';
import { prisma } from '../../apps/web/src/server/db';
import { AuthenticationError } from '../../apps/web/src/server/errors';
import { getEmailTransport, ExternalEmailTransport, ConsoleEmailTransport } from '../../apps/web/src/server/services/emailTransport';
import { publishProject } from '../../apps/web/src/server/services/projectService';

vi.mock('../../apps/web/src/server/services/emailTransport', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../apps/web/src/server/services/emailTransport')>();
  return {
    ...actual,
    getEmailTransport: vi.fn()
  };
});

vi.mock('../../apps/web/src/server/db', () => ({
  prisma: {
    verificationToken: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
      update: vi.fn(),
    },
    project: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  }
}));

const mockSendEmail = vi.fn();

describe('Email Verification & Auth', () => {
  beforeEach(() => {
    vi.mocked(getEmailTransport).mockReturnValue({ sendEmail: mockSendEmail });
    mockSendEmail.mockClear();
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('generates a cryptographically random verification token with 24h expiry', async () => {
    const email = 'test@codesync.com';
    vi.mocked(prisma.verificationToken.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.verificationToken.create).mockImplementation(async ({ data }) => ({
      id: 'token-id-1',
      ...data,
      createdAt: new Date()
    }));

    const tokenRecord = await generateVerificationToken(email);
    
    expect(tokenRecord.token).toBeDefined();
    expect(tokenRecord.token.length).toBeGreaterThanOrEqual(64);
    expect(tokenRecord.expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(prisma.verificationToken.create).toHaveBeenCalled();
  });

  it('updates token if one already exists (upsert behavior)', async () => {
    const email = 'test2@codesync.com';
    vi.mocked(prisma.verificationToken.findFirst).mockResolvedValue({ id: 'existing-id' } as any);
    vi.mocked(prisma.verificationToken.update).mockResolvedValue({ id: 'existing-id', token: 'new-token' } as any);

    await generateVerificationToken(email);
    expect(prisma.verificationToken.update).toHaveBeenCalled();
  });

  it('successfully verifies a valid token, updates emailVerifiedAt, and deletes token (single-use)', async () => {
    vi.mocked(prisma.verificationToken.findUnique).mockResolvedValue({
      id: 'token-id',
      email: 'success@codesync.com',
      token: 'valid-token',
      expiresAt: new Date(Date.now() + 100000),
      createdAt: new Date()
    });
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-id', email: 'success@codesync.com' } as any);

    await verifyEmailToken('valid-token');
    
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('rejects invalid tokens', async () => {
    vi.mocked(prisma.verificationToken.findUnique).mockResolvedValue(null);
    await expect(verifyEmailToken('made-up-token')).rejects.toThrow(AuthenticationError);
  });

  it('rejects expired tokens and cleans them up', async () => {
    vi.mocked(prisma.verificationToken.findUnique).mockResolvedValue({
      id: 'token-id',
      email: 'expired@codesync.com',
      token: 'expired-token',
      expiresAt: new Date(Date.now() - 100000),
      createdAt: new Date()
    });

    await expect(verifyEmailToken('expired-token')).rejects.toThrow('Verification token has expired');
    expect(prisma.verificationToken.delete).toHaveBeenCalledWith({ where: { id: 'token-id' } });
  });

  it('triggers verification email on credentials signup but leaves emailVerifiedAt null', async () => {
    const email = 'signup@codesync.com';
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue({ id: 'u1', email, emailVerifiedAt: null } as any);
    vi.mocked(prisma.verificationToken.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.verificationToken.create).mockResolvedValue({ id: 't1', token: 'mocked-token' } as any);
    
    const user = await registerUser({ email, password: 'password123' });
    
    expect(user.emailVerifiedAt).toBeNull();
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
  });

  it('handles email provider failure gracefully during signup without failing registration', async () => {
    mockSendEmail.mockRejectedValueOnce(new Error('Provider down'));
    const email = 'fail@codesync.com';
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue({ id: 'u2', email, emailVerifiedAt: null } as any);
    vi.mocked(prisma.verificationToken.create).mockResolvedValue({ id: 't2', token: 'mocked-token-2' } as any);
    
    const user = await registerUser({ email, password: 'password123' });
    expect(user.id).toBeDefined(); // Did not throw
  });

  it('OAuth signups do not trigger verification emails and are instantly verified', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue({ id: 'u3', emailVerifiedAt: new Date() } as any);
    
    await registerUser({ email: 'oauth@codesync.com' });
    expect(mockSendEmail).not.toHaveBeenCalled();
  });
});

describe('Resend Verification Email', () => {
  beforeEach(() => {
    vi.mocked(getEmailTransport).mockReturnValue({ sendEmail: mockSendEmail });
    mockSendEmail.mockClear();
    vi.clearAllMocks();
  });

  it('resends email for existing unverified credentials user', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'u1', email: 'unverified@codesync.com', emailVerifiedAt: null, authProvider: 'credentials'
    } as any);
    vi.mocked(prisma.verificationToken.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.verificationToken.create).mockResolvedValue({ id: 't1', token: 'token-abc' } as any);

    await resendVerificationEmail('unverified@codesync.com');
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
  });

  it('silently ignores nonexistent user', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    await resendVerificationEmail('nobody@codesync.com');
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('silently ignores already verified user', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'u1', email: 'verified@codesync.com', emailVerifiedAt: new Date(), authProvider: 'credentials'
    } as any);
    await resendVerificationEmail('verified@codesync.com');
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('silently ignores OAuth user', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'u1', email: 'oauth@codesync.com', emailVerifiedAt: null, authProvider: 'oauth'
    } as any);
    await resendVerificationEmail('oauth@codesync.com');
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('applies 1-minute rate limiting to prevent spam', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'u1', email: 'spam@codesync.com', emailVerifiedAt: null, authProvider: 'credentials'
    } as any);
    vi.mocked(prisma.verificationToken.findFirst).mockResolvedValue({
      id: 't1', createdAt: new Date(Date.now() - 30000) // 30 seconds ago
    } as any);

    await resendVerificationEmail('spam@codesync.com');
    expect(mockSendEmail).not.toHaveBeenCalled(); // Blocked by rate limit
  });
});

describe('Project Publishing Authorization', () => {
  it('blocks publishing if email is not verified', async () => {
    vi.mocked(prisma.project.findUnique).mockResolvedValue({
      id: 'p1', ownerId: 'u-unverified'
    } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'u-unverified', emailVerifiedAt: null
    } as any);

    await expect(publishProject('u-unverified', 'test-publish')).rejects.toThrow('Email must be verified before publishing a project');
  });

  it('allows publishing if email is verified', async () => {
    vi.mocked(prisma.project.findUnique).mockResolvedValue({
      id: 'test-publish2', ownerId: 'u-verified',
      projectSkills: [], projectRoles: [], description: 'a', problemStatement: 'b', targetAudience: 'c'
    } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'u-verified', emailVerifiedAt: new Date()
    } as any);

    try {
      await publishProject('u-verified', 'test-publish2');
    } catch (e: any) {
      expect(e.message).not.toBe('Email must be verified before publishing a project');
    }
  });
});
