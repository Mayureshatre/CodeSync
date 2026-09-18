import { prisma } from '../db';
import { NotFoundError, ConflictError } from '../errors';
import { enqueueMatchRecompute } from '@codesync/core/queue';
import { UserSkillInput } from '../../lib/validations/skill';

export async function searchSkills(query: string) {
  if (!query || query.length < 2) return [];

  return prisma.skill.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { aliases: { hasSome: [query.toLowerCase()] } }
      ],
      status: 'approved'
    },
    take: 20,
    orderBy: { name: 'asc' }
  });
}

export async function getUserSkills(userId: string) {
  return prisma.userSkill.findMany({
    where: { userId },
    include: { skill: true },
    orderBy: { proficiency: 'desc' } // Roughly sorting, or by name
  });
}

export async function addUserSkill(userId: string, data: UserSkillInput) {
  // Check if skill exists
  const skill = await prisma.skill.findUnique({ where: { id: data.skillId } });
  if (!skill) throw new NotFoundError('Skill not found');

  // Check if already has this skill
  const existing = await prisma.userSkill.findUnique({
    where: { userId_skillId: { userId, skillId: data.skillId } }
  });

  if (existing) {
    throw new ConflictError('You already have this skill on your profile');
  }

  const result = await prisma.userSkill.create({
    data: {
      userId,
      skillId: data.skillId,
      proficiency: data.proficiency,
      yearsExperience: data.yearsExperience || null,
    },
    include: { skill: true }
  });

  await enqueueMatchRecompute({ userId });
  return result;
}

export async function updateUserSkill(userId: string, skillId: string, data: Omit<UserSkillInput, 'skillId'>) {
  const existing = await prisma.userSkill.findUnique({
    where: { userId_skillId: { userId, skillId } }
  });

  if (!existing) {
    throw new NotFoundError('Skill not found on your profile');
  }

  const result = await prisma.userSkill.update({
    where: { userId_skillId: { userId, skillId } },
    data: {
      proficiency: data.proficiency,
      yearsExperience: data.yearsExperience || null,
    },
    include: { skill: true }
  });

  await enqueueMatchRecompute({ userId });
  return result;
}

export async function removeUserSkill(userId: string, skillId: string) {
  const existing = await prisma.userSkill.findUnique({
    where: { userId_skillId: { userId, skillId } }
  });

  if (!existing) {
    throw new NotFoundError('Skill not found on your profile');
  }

  const result = await prisma.userSkill.delete({
    where: { userId_skillId: { userId, skillId } }
  });

  await enqueueMatchRecompute({ userId });
  return result;
}


