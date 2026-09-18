import { prisma } from '../db';
import { enqueueMatchRecompute, enqueueNotification } from '@codesync/core/queue';
import { NotFoundError, ForbiddenError, ConflictError } from '../errors';
import { ProjectInput } from '../../lib/validations/project';
import { createNotification } from './notificationService';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '') + '-' + Math.random().toString(36).substring(2, 8);
}

export async function createProject(ownerId: string, data: ProjectInput) {
  const slug = generateSlug(data.name);

  return prisma.project.create({
    data: {
      ownerId,
      name: data.name,
      slug,
      description: data.description,
      problemStatement: data.problemStatement,
      goals: data.goals,
      category: data.category,
      status: 'draft',
      teamSizeTarget: data.teamSizeTarget,
      durationEstimate: data.durationEstimate,
      weeklyCommitment: data.weeklyCommitment,
      remoteFlag: data.remoteFlag,
      collaborationType: data.collaborationType,
      visibility: data.visibility,
      repoUrl: data.repoUrl || null,
      demoUrl: data.demoUrl || null,
      tags: data.tags,
      experienceRequirement: data.experienceRequirement || null,
      
      projectSkills: {
        create: data.projectSkills?.map(ps => ({
          skillId: ps.skillId,
          requirementType: ps.requirementType,
          minProficiency: ps.minProficiency
        })) || []
      },
      
      projectRoles: {
        create: data.projectRoles?.map(pr => ({
          title: pr.title,
          slotsAvailable: pr.slotsAvailable,
          projectRoleSkills: {
            create: pr.skills?.map(prs => ({
              skillId: prs.skillId,
              requirementType: prs.requirementType,
              minProficiency: prs.minProficiency
            })) || []
          }
        })) || []
      }
    },
    include: {
      projectSkills: { include: { skill: true } },
      projectRoles: { include: { projectRoleSkills: { include: { skill: true } } } }
    }
  });
}

export async function updateProject(ownerId: string, projectId: string, data: ProjectInput) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  
  if (!project) throw new NotFoundError('Project not found');
  if (project.ownerId !== ownerId) throw new ForbiddenError('You do not have permission to edit this project');

  // For full update, we replace skills and roles entirely to keep it simple, or update them in a transaction.
  // Given Prisma's nested writes, replacing is easiest: delete old, create new.
  
  const updatedProject = await prisma.$transaction(async (tx) => {
    // Delete existing
    await tx.projectSkill.deleteMany({ where: { projectId } });
    await tx.projectRole.deleteMany({ where: { projectId } });

    // Update project and recreate nested
    return tx.project.update({
      where: { id: projectId },
      data: {
        name: data.name,
        description: data.description,
        problemStatement: data.problemStatement,
        goals: data.goals,
        category: data.category,
        status: data.status,
        teamSizeTarget: data.teamSizeTarget,
        durationEstimate: data.durationEstimate,
        weeklyCommitment: data.weeklyCommitment,
        remoteFlag: data.remoteFlag,
        collaborationType: data.collaborationType,
        visibility: data.visibility,
        repoUrl: data.repoUrl || null,
        demoUrl: data.demoUrl || null,
        tags: data.tags,
        experienceRequirement: data.experienceRequirement || null,
        
        projectSkills: {
          create: data.projectSkills?.map(ps => ({
            skillId: ps.skillId,
            requirementType: ps.requirementType,
            minProficiency: ps.minProficiency
          })) || []
        },
        
        projectRoles: {
          create: data.projectRoles?.map(pr => ({
            title: pr.title,
            slotsAvailable: pr.slotsAvailable,
            projectRoleSkills: {
              create: pr.skills?.map(prs => ({
                skillId: prs.skillId,
                requirementType: prs.requirementType,
                minProficiency: prs.minProficiency
              })) || []
            }
          })) || []
        }
      },
      include: {
        projectSkills: { include: { skill: true } },
        projectRoles: { include: { projectRoleSkills: { include: { skill: true } } } }
      }
    });
  });

  // M8-D-D: Notify existing project members about the update
  try {
    const members = await prisma.projectMember.findMany({
      where: { projectId, status: 'active' }
    });

    for (const member of members) {
      if (member.userId === ownerId) continue; // Don't notify the owner

      const notification = await createNotification(member.userId, 'PROJECT_ACTIVITY', {
        event: 'project_updated',
        projectId
      });

      await enqueueNotification({
        notificationId: notification.id,
        userId: member.userId,
        category: 'PROJECT_ACTIVITY',
        payload: notification.payload
      });
    }
  } catch (notifError) {
    console.error('Failed to dispatch project_updated notification', notifError);
  }

  if (updatedProject.status === 'open') {
    await enqueueMatchRecompute({ projectId });
  }

  return updatedProject;
}

export async function deleteProject(ownerId: string, projectId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  
  if (!project) throw new NotFoundError('Project not found');
  if (project.ownerId !== ownerId) throw new ForbiddenError('You do not have permission to delete this project');

  // Soft delete by setting status to archived
  return prisma.project.update({
    where: { id: projectId },
    data: { status: 'archived' }
  });
}

export async function publishProject(ownerId: string, projectId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  
  if (!project) throw new NotFoundError('Project not found');
  if (project.ownerId !== ownerId) throw new ForbiddenError('You do not have permission to publish this project');
  
  // Require email verification per SRS 12.1 is handled via auth/actor if needed, 
  // but we can check the user here
  const user = await prisma.user.findUnique({ where: { id: ownerId } });
  if (!user?.emailVerifiedAt) {
    throw new ForbiddenError('Email must be verified before publishing a project');
  }

  return prisma.project.update({
    where: { id: projectId },
    data: { 
      status: 'open',
      publishedAt: new Date()
    }
  });
}

export async function getProjectBySlug(slug: string, actorId?: string) {
  const project = await prisma.project.findUnique({
    where: { slug },
    include: {
      owner: { select: { id: true, email: true, profile: true } },
      projectSkills: { include: { skill: true } },
      projectRoles: { include: { projectRoleSkills: { include: { skill: true } } } }
    }
  });

  if (!project) throw new NotFoundError('Project not found');

  // Draft projects are hidden unless owner
  if (project.status === 'draft' && project.ownerId !== actorId) {
    throw new NotFoundError('Project not found');
  }

  return project;
}

export async function getProjectById(id: string, actorId?: string) {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      projectSkills: { include: { skill: true } },
      projectRoles: { include: { projectRoleSkills: { include: { skill: true } } } }
    }
  });

  if (!project) throw new NotFoundError('Project not found');

  // Draft projects are hidden unless owner
  if (project.status === 'draft' && project.ownerId !== actorId) {
    throw new NotFoundError('Project not found');
  }

  return project;
}

export async function getProjectsByOwner(ownerId: string) {
  return prisma.project.findMany({
    where: { ownerId },
    select: { id: true, name: true, status: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

export async function completeProject(ownerId: string, projectId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  
  if (!project) throw new NotFoundError('Project not found');
  if (project.ownerId !== ownerId) throw new ForbiddenError('You do not have permission to edit this project');
  // It should be open or in_progress to be marked as completed
  if (project.status !== 'open' && project.status !== 'in_progress') {
    throw new ForbiddenError('Project must be open or in progress to be marked as completed');
  }

  return prisma.project.update({
    where: { id: projectId },
    data: { status: 'completed' }
  });
}




