import { prisma } from '../db';
import { Prisma } from '@prisma/client';
import { NotFoundError, ForbiddenError, ConflictError } from '../errors';
import { ApplyToProjectInput, applyToProjectSchema, UpdateApplicationStatusInput, updateApplicationStatusSchema } from '../../lib/validations/application';
import { getAvailableApplicationActions, ApplicationStatus } from '@codesync/shared-types';
import { createNotification } from './notificationService';
import { enqueueNotification } from '@codesync/core/queue';
import { ensureWorkspace } from './workspaceService';

export async function applyToProject(userId: string, projectId: string, data: ApplyToProjectInput) {
  const parsedData = applyToProjectSchema.parse(data);

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { projectRoles: true },
  });

  if (!project) {
    throw new NotFoundError('Project not found');
  }

  if (project.ownerId === userId) {
    throw new ForbiddenError('Project owners cannot apply to their own project');
  }

  // Only open projects can receive applications
  if (project.status !== 'open') {
    throw new ConflictError('Project is not open for applications');
  }

  if (parsedData.roleId) {
    const roleExists = project.projectRoles.some(r => r.id === parsedData.roleId);
    if (!roleExists) {
      throw new NotFoundError('Project role not found');
    }
  }

  // Check for duplicate application per SRS: prevented while non-terminal, re-applying after withdrawal/rejection is allowed.
  const existingApplication = await prisma.application.findFirst({
    where: {
      projectId,
      userId,
      status: { notIn: ['withdrawn', 'rejected'] }
    },
  });

  if (existingApplication) {
    throw new ConflictError('You have an active application for this project already');
  }

  const existingMember = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: { projectId, userId }
    }
  });

  if (existingMember) {
    throw new ConflictError('You are already a member of this project');
  }

  try {
    const application = await prisma.application.create({
      data: {
        projectId,
        userId,
        roleId: parsedData.roleId || null,
        message: parsedData.message,
        status: 'applied',
      },
    });

    try {
      const notification = await createNotification(project.ownerId, 'APPLICATION', {
        event: 'application_submitted',
        applicationId: application.id,
        projectId,
        applicantId: userId
      });
      await enqueueNotification({
        notificationId: notification.id,
        userId: project.ownerId,
        category: 'APPLICATION',
        payload: notification.payload
      });
    } catch (notifError) {
      console.error('Failed to dispatch application_submitted notification', notifError);
    }

    return application;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictError('You have an active application for this project already');
    }
    throw error;
  }
}

export async function getApplicationsForDeveloper(userId: string) {
  return prisma.application.findMany({
    where: { userId },
    include: { project: true, role: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

export async function getApplicationsForProject(ownerId: string, projectId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  
  if (!project) {
    throw new NotFoundError('Project not found');
  }
  
  if (project.ownerId !== ownerId) {
    throw new ForbiddenError('Only the project owner can view applications');
  }

  return prisma.application.findMany({
    where: { projectId },
    include: { user: { include: { profile: true } }, role: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

export async function updateApplicationStatus(ownerId: string, applicationId: string, data: UpdateApplicationStatusInput) {
  const parsedData = updateApplicationStatusSchema.parse(data);
  const { status } = parsedData;

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { project: true },
  });

  if (!application) {
    throw new NotFoundError('Application not found');
  }

  if (application.project.ownerId !== ownerId) {
    throw new ForbiddenError('Only the project owner can update application status');
  }

  const availableActions = getAvailableApplicationActions(application.status as ApplicationStatus, 'owner');
  if (!availableActions.includes(status as ApplicationStatus)) {
    throw new ConflictError(`Invalid state transition from ${application.status} to ${status}`);
  }

  let updatedApplication;
  if (status === 'accepted') {
    updatedApplication = await prisma.$transaction(async (tx) => {
      const updatedApp = await tx.application.update({
        where: { id: applicationId },
        data: { status },
      });

      const existingMember = await tx.projectMember.findUnique({
        where: { projectId_userId: { projectId: application.projectId, userId: application.userId } }
      });

      if (!existingMember) {
        await tx.projectMember.create({
          data: {
            projectId: application.projectId,
            userId: application.userId,
            roleId: application.roleId,
            status: 'active',
          }
        });

        await tx.project.update({
          where: { id: application.projectId },
          data: { teamSizeCurrent: { increment: 1 } },
        });

        // M10: Ensure Workspace exists on member joined
        await ensureWorkspace(tx, application.projectId, application.userId);
      }

      return updatedApp;
    });
  } else {
    updatedApplication = await prisma.application.update({
      where: { id: applicationId },
      data: { status },
    });
  }

  try {
    const notification = await createNotification(application.userId, 'APPLICATION', {
      event: 'application_status_updated',
      applicationId,
      projectId: application.projectId,
      status
    });
    await enqueueNotification({
      notificationId: notification.id,
      userId: application.userId,
      category: 'APPLICATION',
      payload: notification.payload
    });
  } catch (notifError) {
    console.error('Failed to dispatch application_status_updated notification', notifError);
  }

  return updatedApplication;
}

export async function withdrawApplication(userId: string, applicationId: string) {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { project: true }
  });

  if (!application) {
    throw new NotFoundError('Application not found');
  }

  if (application.userId !== userId) {
    throw new ForbiddenError('You can only withdraw your own applications');
  }

  const availableActions = getAvailableApplicationActions(application.status as ApplicationStatus, 'developer');
  if (!availableActions.includes('withdrawn')) {
    throw new ConflictError(`Invalid state transition from ${application.status} to withdrawn`);
  }

  const updatedApplication = await prisma.application.update({
    where: { id: applicationId },
    data: { status: 'withdrawn' },
  });

  try {
    const notification = await createNotification(application.project.ownerId, 'APPLICATION', {
      event: 'application_withdrawn',
      applicationId,
      projectId: application.projectId,
      applicantId: userId
    });
    await enqueueNotification({
      notificationId: notification.id,
      userId: application.project.ownerId,
      category: 'APPLICATION',
      payload: notification.payload
    });
  } catch (notifError) {
    console.error('Failed to dispatch application_withdrawn notification', notifError);
  }

  return updatedApplication;
}
