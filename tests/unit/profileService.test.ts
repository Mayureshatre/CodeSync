import { describe, it, expect, vi } from 'vitest';
import { calculateProfileCompleteness, getProfileByUsername } from '../../apps/web/src/server/services/profileService';
import { prisma } from '../../apps/web/src/server/db';
import { NotFoundError } from '../../apps/web/src/server/errors';

vi.mock('../../apps/web/src/server/db', () => ({
  prisma: {
    profile: {
      findUnique: vi.fn(),
    }
  }
}));

describe('profileService', () => {
  describe('calculateProfileCompleteness', () => {
    it('returns 0 for no profile', () => {
      expect(calculateProfileCompleteness(null, [])).toBe(0);
    });

    it('calculates 40 points for basic info', () => {
      const profile = { displayName: 'John', bio: 'Dev', location: 'NY', experienceLevel: 'advanced' };
      expect(calculateProfileCompleteness(profile, [])).toBe(40);
    });

    it('calculates 40 points for 3+ skills', () => {
      const skills = [{}, {}, {}];
      expect(calculateProfileCompleteness({}, skills)).toBe(40);
    });

    it('calculates 20 points for 1-2 skills', () => {
      const skills = [{}];
      expect(calculateProfileCompleteness({}, skills)).toBe(20);
    });

    it('calculates 20 points for having any link', () => {
      expect(calculateProfileCompleteness({ githubUrl: 'url' }, [])).toBe(20);
    });

    it('calculates 100 points for complete profile', () => {
      const profile = { displayName: 'John', bio: 'Dev', location: 'NY', experienceLevel: 'advanced', githubUrl: 'url' };
      const skills = [{}, {}, {}];
      expect(calculateProfileCompleteness(profile, skills)).toBe(100);
    });
  });

  describe('getProfileByUsername', () => {
    it('throws NotFoundError if profile does not exist', async () => {
      vi.mocked(prisma.profile.findUnique).mockResolvedValue(null);
      await expect(getProfileByUsername('test')).rejects.toThrow(NotFoundError);
    });

    it('throws NotFoundError if profile is unlisted and requester is not owner', async () => {
      vi.mocked(prisma.profile.findUnique).mockResolvedValue({
        userId: 'user1',
        profileVisibility: 'unlisted',
      } as any);
      await expect(getProfileByUsername('test', 'user2')).rejects.toThrow(NotFoundError);
    });

    it('returns profile if profile is unlisted but requester is owner', async () => {
      vi.mocked(prisma.profile.findUnique).mockResolvedValue({
        userId: 'user1',
        profileVisibility: 'unlisted',
      } as any);
      const profile = await getProfileByUsername('test', 'user1');
      expect(profile.userId).toBe('user1');
    });

    it('returns profile if profile is public', async () => {
      vi.mocked(prisma.profile.findUnique).mockResolvedValue({
        userId: 'user1',
        profileVisibility: 'public',
      } as any);
      const profile = await getProfileByUsername('test', 'user2');
      expect(profile.userId).toBe('user1');
    });
  });
});
