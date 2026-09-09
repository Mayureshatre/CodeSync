import { prisma } from '../db';
import { Prisma } from '@prisma/client';
import { NotFoundError, ForbiddenError, ConflictError, ValidationError } from '../errors';
import { SaveProjectInput, saveProjectSchema, SaveDeveloperInput, saveDeveloperSchema, SaveSearchInput, saveSearchSchema } from '../../lib/validations/savedItem';

export async function saveProject(userId: string, data: SaveProjectInput) {
  const parsedData = saveProjectSchema.parse(data);

  const project = await prisma.project.findUnique({
    where: { id: parsedData.targetId },
  });

  if (!project) {
    throw new NotFoundError('Project not found');
  }

  try {
    return await prisma.savedProject.create({
      data: {
        userId,
        targetId: parsedData.targetId,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictError('Project is already saved');
    }
    throw error;
  }
}

export async function getSavedProjects(userId: string) {
  return prisma.savedProject.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function removeSavedProject(userId: string, savedProjectId: string) {
  const savedProject = await prisma.savedProject.findUnique({
    where: { id: savedProjectId },
  });

  if (!savedProject) {
    throw new NotFoundError('Saved project not found');
  }

  if (savedProject.userId !== userId) {
    throw new ForbiddenError('You can only remove your own saved projects');
  }

  return prisma.savedProject.delete({
    where: { id: savedProjectId },
  });
}

export async function saveDeveloper(userId: string, data: SaveDeveloperInput) {
  const parsedData = saveDeveloperSchema.parse(data);

  if (userId === parsedData.targetId) {
    throw new ConflictError('You cannot save your own profile');
  }

  const user = await prisma.user.findUnique({
    where: { id: parsedData.targetId },
  });

  if (!user) {
    throw new NotFoundError('Developer not found');
  }

  try {
    return await prisma.savedDeveloper.create({
      data: {
        userId,
        targetId: parsedData.targetId,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictError('Developer is already saved');
    }
    throw error;
  }
}

export async function getSavedDevelopers(userId: string) {
  return prisma.savedDeveloper.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function removeSavedDeveloper(userId: string, savedDeveloperId: string) {
  const savedDeveloper = await prisma.savedDeveloper.findUnique({
    where: { id: savedDeveloperId },
  });

  if (!savedDeveloper) {
    throw new NotFoundError('Saved developer not found');
  }

  if (savedDeveloper.userId !== userId) {
    throw new ForbiddenError('You can only remove your own saved developers');
  }

  return prisma.savedDeveloper.delete({
    where: { id: savedDeveloperId },
  });
}

export async function saveSearch(userId: string, data: SaveSearchInput) {
  const parsedData = saveSearchSchema.parse(data);

  // Additional check to prevent duplicate searches can be implemented here if required
  // But JSON deep equality comparison might be complex, so we'll just insert for now
  // unless we want to serialize keys and check.
  
  return prisma.savedSearch.create({
    data: {
      userId,
      queryParams: parsedData.queryParams as Prisma.JsonObject,
      alertEnabled: parsedData.alertEnabled,
    },
  });
}

export async function getSavedSearches(userId: string) {
  return prisma.savedSearch.findMany({
    where: { userId },
  });
}

export async function removeSavedSearch(userId: string, savedSearchId: string) {
  const savedSearch = await prisma.savedSearch.findUnique({
    where: { id: savedSearchId },
  });

  if (!savedSearch) {
    throw new NotFoundError('Saved search not found');
  }

  if (savedSearch.userId !== userId) {
    throw new ForbiddenError('You can only remove your own saved searches');
  }

  return prisma.savedSearch.delete({
    where: { id: savedSearchId },
  });
}
