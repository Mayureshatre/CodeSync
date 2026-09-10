import { prisma } from '../db';
import { Prisma } from '@prisma/client';
import { NotFoundError, ForbiddenError, ConflictError } from '../errors';
import { InviteDeveloperInput, inviteDeveloperSchema, RespondToInvitationInput, respondToInvitationSchema } from '../../lib/validations/invitation';
import { getAvailableInvitationActions, InvitationStatus } from '@codesync/shared-types';
import { createNotification } from './notificationService';
import { enqueueNotification } from '../jobs/queue';

export async function inviteDeveloper(ownerId: string, projectId: string, data: InviteDeveloperInput) {
  const parsedData = inviteDeveloperSchema.parse(data);

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { projectRoles: true },
  });

  if (!project) {
    throw new NotFoundError('Project not found');
  }

  if (project.ownerId !== ownerId) {
    throw new ForbiddenError('Only the project owner can invite developers');
  }

  if (project.status !== 'open') {
    throw new ConflictError('Project is not open for invitations');
  }

  if (parsedData.roleId) {
    const roleExists = project.projectRoles.some(r => r.id === parsedData.roleId);
    if (!roleExists) {
      throw new NotFoundError('Project role not found');
    }
  }

  const user = await prisma.user.findUnique({ where: { id: parsedData.invitedUserId } });
  if (!user) {
    throw new NotFoundError('Developer not found');
  }

  const existingMember = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: { projectId, userId: parsedData.invitedUserId }
    }
  });

  if (existingMember) {
    throw new ConflictError('Developer is already a member of this project');
  }

  try {
    const invitation = await prisma.invitation.create({
      data: {
        projectId,
        invitedByUserId: ownerId,
        invitedUserId: parsedData.invitedUserId,
        roleId: parsedData.roleId || null,
        matchScoreSnapshot: parsedData.matchScoreSnapshot,
        reasonSnapshot: parsedData.reasonSnapshot,
        status: 'invited',
      },
    });

    try {
      const notification = await createNotification(parsedData.invitedUserId, 'INVITATION', {
        event: 'invitation_received',
        invitationId: invitation.id,
        projectId,
        inviterId: ownerId
      });
      await enqueueNotification({
        notificationId: notification.id,
        userId: parsedData.invitedUserId,
        category: 'INVITATION',
        payload: notification.payload
      });
    } catch (notifError) {
      console.error('Failed to dispatch invitation_received notification', notifError);
    }

    return invitation;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictError('You have already invited this developer to this project');
    }
    throw error;
  }
}

export async function getInvitationsForDeveloper(userId: string) {
  return prisma.invitation.findMany({
    where: { invitedUserId: userId },
    include: { project: true, role: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function respondToInvitation(userId: string, invitationId: string, data: RespondToInvitationInput) {
  const parsedData = respondToInvitationSchema.parse(data);
  const actionStatus = parsedData.action === 'accept' ? 'accepted' : 'declined';

  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
  });

  if (!invitation) {
    throw new NotFoundError('Invitation not found');
  }

  if (invitation.invitedUserId !== userId) {
    throw new ForbiddenError('You can only respond to your own invitations');
  }

  const availableActions = getAvailableInvitationActions(invitation.status as InvitationStatus, 'developer');
  if (!availableActions.includes(actionStatus as InvitationStatus)) {
    throw new ConflictError(`Invalid state transition from ${invitation.status} to ${actionStatus}`);
  }

  let updatedInvitation;
  if (actionStatus === 'accepted') {
    updatedInvitation = await prisma.$transaction(async (tx) => {
      const updatedInv = await tx.invitation.update({
        where: { id: invitationId },
        data: { status: 'accepted' },
      });

      const existingMember = await tx.projectMember.findUnique({
        where: { projectId_userId: { projectId: invitation.projectId, userId: invitation.invitedUserId } }
      });

      if (!existingMember) {
        await tx.projectMember.create({
          data: {
            projectId: invitation.projectId,
            userId: invitation.invitedUserId,
            roleId: invitation.roleId,
            status: 'active',
          }
        });

        await tx.project.update({
          where: { id: invitation.projectId },
          data: { teamSizeCurrent: { increment: 1 } },
        });
      }

      return updatedInv;
    });
  } else {
    updatedInvitation = await prisma.invitation.update({
      where: { id: invitationId },
      data: { status: 'declined' },
    });
  }

  try {
    const notification = await createNotification(invitation.invitedByUserId, 'INVITATION', {
      event: 'invitation_responded',
      invitationId,
      projectId: invitation.projectId,
      status: actionStatus,
      responderId: userId
    });
    await enqueueNotification({
      notificationId: notification.id,
      userId: invitation.invitedByUserId,
      category: 'INVITATION',
      payload: notification.payload
    });
  } catch (notifError) {
    console.error('Failed to dispatch invitation_responded notification', notifError);
  }

  return updatedInvitation;
}
