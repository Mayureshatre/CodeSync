import { prisma } from '../db';
import { NotFoundError, ConflictError, ForbiddenError } from '../errors';
import { ProfileInput } from '../../lib/validations/profile';
import { isValidAvatarUrl } from './storageService';

export async function getProfileByUserId(userId: string) {
  return prisma.profile.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          email: true,
          userSkills: {
            include: { skill: true }
          }
        }
      }
    }
  });
}

export async function getProfileByUsername(username: string, actorId?: string) {
  const profile = await prisma.profile.findUnique({
    where: { username },
    include: {
      user: {
        select: {
          id: true,
          userSkills: {
            include: { skill: true }
          }
        }
      }
    }
  });

  if (!profile) {
    throw new NotFoundError('Profile not found');
  }

  // If the profile is unlisted and the requester is not the owner, return 404
  if (profile.profileVisibility === 'unlisted' && profile.userId !== actorId) {
    throw new NotFoundError('Profile not found');
  }

  return profile;
}

export async function updateProfile(userId: string, data: ProfileInput) {
  // Enforce server-side authorization on avatarUrl
  if (data.avatarUrl && !isValidAvatarUrl(userId, data.avatarUrl)) {
    throw new ForbiddenError('Invalid or unauthorized avatar URL');
  }

  // Check username uniqueness if changed
  const existingWithUsername = await prisma.profile.findFirst({
    where: { 
      username: { equals: data.username, mode: 'insensitive' },
      userId: { not: userId } 
    }
  });

  if (existingWithUsername) {
    throw new ConflictError('Username is already taken');
  }

  return prisma.profile.upsert({
    where: { userId },
    update: {
      ...data,
      // Convert empty strings to null for optional URLs
      githubUrl: data.githubUrl || null,
      linkedinUrl: data.linkedinUrl || null,
      portfolioUrl: data.portfolioUrl || null,
      websiteUrl: data.websiteUrl || null,
      avatarUrl: data.avatarUrl || null,
    },
    create: {
      userId,
      ...data,
      githubUrl: data.githubUrl || null,
      linkedinUrl: data.linkedinUrl || null,
      portfolioUrl: data.portfolioUrl || null,
      websiteUrl: data.websiteUrl || null,
      avatarUrl: data.avatarUrl || null,
    }
  });
}

export function calculateProfileCompleteness(profile: any, userSkills: any[]): number {
  let score = 0;
  if (!profile) return score;

  // Basic info (40 points)
  if (profile.displayName) score += 10;
  if (profile.bio) score += 10;
  if (profile.location) score += 10;
  if (profile.experienceLevel) score += 10;

  // Skills (40 points)
  if (userSkills && userSkills.length > 0) score += 20;
  if (userSkills && userSkills.length >= 3) score += 20;

  // Links (20 points)
  if (profile.githubUrl || profile.linkedinUrl || profile.portfolioUrl || profile.websiteUrl) score += 20;

  return score;
}
