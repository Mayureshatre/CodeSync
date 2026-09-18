import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generatePresignedAvatarUploadUrl, generatePresignedResumeUploadUrl, generatePresignedDownloadUrl, deleteObject, isValidAvatarUrl } from '../../apps/web/src/server/services/storageService';
import { finalizeResumeUpload, getResumeDownloadUrl, deleteResume } from '../../apps/web/src/server/services/resumeService';
import { updateProfile } from '../../apps/web/src/server/services/profileService';
import { prisma } from '../../apps/web/src/server/db';
import { NotFoundError, ForbiddenError } from '../../apps/web/src/server/errors';

vi.mock('@codesync/core/queue', () => ({
  enqueueMatchRecompute: vi.fn()
}));

vi.mock('../../apps/web/src/server/db', () => ({
  prisma: {
    resume: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    },
    profile: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      upsert: vi.fn(),
    }
  }
}));

describe('Storage Service Validation', () => {
  it('generates presigned url for valid avatar', async () => {
    const res = await generatePresignedAvatarUploadUrl('user-123', 'image/jpeg', 1024);
    expect(res.url).toContain('http://codesync-public.localhost:9000/avatars/user-123/');
    expect(res.url).toContain('.jpg?X-Amz-Algorithm=');
    expect(res.key).toMatch(/^avatars\/user-123\/.*\.jpg$/);
    expect(res.publicUrl).toBeDefined();
  });

  it('rejects invalid avatar mime type', async () => {
    await expect(generatePresignedAvatarUploadUrl('user-123', 'image/gif', 1024))
      .rejects.toThrow(/Invalid file type/);
  });

  it('rejects avatar file too large', async () => {
    const size = 6 * 1024 * 1024; // 6MB
    await expect(generatePresignedAvatarUploadUrl('user-123', 'image/png', size))
      .rejects.toThrow(/File size exceeds/);
  });

  it('generates presigned url for valid resume', async () => {
    const res = await generatePresignedResumeUploadUrl('user-456', 'application/pdf', 1024);
    expect(res.url).toContain('http://codesync-private.localhost:9000/resumes/user-456/');
    expect(res.url).toContain('.pdf?X-Amz-Algorithm=');
    expect(res.key).toMatch(/^resumes\/user-456\/.*\.pdf$/);
  });

  it('rejects invalid resume mime type', async () => {
    await expect(generatePresignedResumeUploadUrl('user-456', 'application/msword', 1024))
      .rejects.toThrow(/Invalid file type/);
  });

  it('rejects resume file too large', async () => {
    const size = 11 * 1024 * 1024; // 11MB
    await expect(generatePresignedResumeUploadUrl('user-456', 'application/pdf', size))
      .rejects.toThrow(/File size exceeds/);
  });
});

describe('Avatar Authorization Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validProfileData = {
    displayName: 'Test',
    username: 'testuser',
    availability: 'available' as const,
    experienceLevel: 'intermediate' as const,
    preferredCollaboration: ['short_term' as const],
    profileVisibility: 'public' as const,
  };

  it('accepts own generated avatar reference', async () => {
    vi.mocked(prisma.profile.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.profile.upsert).mockResolvedValue({} as any);

    const validUrl = 'http://codesync-public.localhost:9000/avatars/user-123/uuid.jpg';
    
    expect(isValidAvatarUrl('user-123', validUrl)).toBe(true);

    await expect(updateProfile('user-123', { ...validProfileData, avatarUrl: validUrl }))
      .resolves.toBeDefined();
  });

  it('rejects another users avatar reference', async () => {
    const crossUserUrl = 'http://codesync-public.localhost:9000/avatars/user-999/uuid.jpg';
    
    expect(isValidAvatarUrl('user-123', crossUserUrl)).toBe(false);

    await expect(updateProfile('user-123', { ...validProfileData, avatarUrl: crossUserUrl }))
      .rejects.toThrow(ForbiddenError);
  });

  it('rejects arbitrary external URL', async () => {
    const externalUrl = 'https://example.com/malicious.jpg';
    
    expect(isValidAvatarUrl('user-123', externalUrl)).toBe(false);

    await expect(updateProfile('user-123', { ...validProfileData, avatarUrl: externalUrl }))
      .rejects.toThrow(ForbiddenError);
  });

  it('rejects malformed avatar references', async () => {
    const malformedUrl = 'http://codesync-public.localhost:9000/avatars/user-123-but-extra/uuid.jpg';
    
    expect(isValidAvatarUrl('user-123', malformedUrl)).toBe(false);

    await expect(updateProfile('user-123', { ...validProfileData, avatarUrl: malformedUrl }))
      .rejects.toThrow(ForbiddenError);
  });

  it('accepts empty or null avatarUrl', async () => {
    vi.mocked(prisma.profile.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.profile.upsert).mockResolvedValue({} as any);

    expect(isValidAvatarUrl('user-123', '')).toBe(true);
    
    // Testing the empty string behavior defined in profileSchema
    await expect(updateProfile('user-123', { ...validProfileData, avatarUrl: '' }))
      .resolves.toBeDefined();
  });
});

describe('Resume Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('finalizes a resume upload and upserts to db', async () => {
    vi.mocked(prisma.resume.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.resume.upsert).mockResolvedValue({ id: '1', userId: 'user-789', fileUrl: 'resumes/user-789/123.pdf', status: 'pending', parsedAt: null } as any);

    await finalizeResumeUpload('user-789', 'resumes/user-789/123.pdf');
    expect(prisma.resume.upsert).toHaveBeenCalled();
  });

  it('deletes old resume from S3 when replacing', async () => {
    vi.mocked(prisma.resume.findUnique).mockResolvedValue({ id: '1', userId: 'user-789', fileUrl: 'resumes/user-789/old.pdf', status: 'pending', parsedAt: null } as any);
    
    await finalizeResumeUpload('user-789', 'resumes/user-789/new.pdf');
    
    expect(prisma.resume.findUnique).toHaveBeenCalled();
    expect(prisma.resume.upsert).toHaveBeenCalled();
  });

  it('fetches a download URL for an existing resume', async () => {
    vi.mocked(prisma.resume.findUnique).mockResolvedValue({ id: '1', userId: 'user-789', fileUrl: 'resumes/user-789/123.pdf', status: 'pending', parsedAt: null } as any);

    const res = await getResumeDownloadUrl('user-789');
    expect(res.url).toContain('http://codesync-private.localhost:9000/resumes/user-789/123.pdf?X-Amz-Algorithm=');
    expect(res.status).toBe('pending');
  });

  it('throws NotFoundError if downloading a non-existent resume', async () => {
    vi.mocked(prisma.resume.findUnique).mockResolvedValue(null);

    await expect(getResumeDownloadUrl('user-789')).rejects.toThrow(NotFoundError);
  });
});
