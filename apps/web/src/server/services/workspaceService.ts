import { prisma } from '../db';
import { Prisma } from '@prisma/client';
import { NotFoundError, ForbiddenError } from '../errors';
import { TaskInput, taskSchema, MilestoneInput, milestoneSchema, ProjectLinkInput, projectLinkSchema } from '../../lib/validations/workspace';
import { createNotification } from './notificationService';

// Ensure workspace access. Also returns workspaceId.
export async function verifyWorkspaceAccess(projectId: string, actorId: string) {
  const member = await prisma.projectMember.findFirst({
    where: {
      projectId,
      userId: actorId,
      status: 'active'
    }
  });

  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });

  if (!project) throw new NotFoundError('Project not found');

  if (!member && project.ownerId !== actorId) {
    throw new ForbiddenError('You must be an active project member to access this workspace');
  }

  const workspace = await prisma.workspace.findUnique({
    where: { projectId }
  });

  if (!workspace) throw new NotFoundError('Workspace not initialized for this project');
  return workspace;
}

export async function ensureWorkspace(tx: Prisma.TransactionClient, projectId: string, actorId: string) {
  let workspace = await tx.workspace.findUnique({
    where: { projectId }
  });

  if (!workspace) {
    workspace = await tx.workspace.create({
      data: { projectId }
    });
    
    // Initial activity event
    await tx.activityEvent.create({
      data: {
        workspaceId: workspace.id,
        type: 'member_joined',
        actorId,
        metadata: { message: 'Project workspace initialized' }
      }
    });
  } else {
    // Generate member joined for subsequent members
    await tx.activityEvent.create({
      data: {
        workspaceId: workspace.id,
        type: 'member_joined',
        actorId,
        metadata: { message: 'Joined the workspace' }
      }
    });
  }

  return workspace;
}

export async function getWorkspaceSummary(projectId: string, actorId: string) {
  const workspace = await verifyWorkspaceAccess(projectId, actorId);
  return prisma.workspace.findUnique({
    where: { id: workspace.id },
    include: {
      tasks: true,
      milestones: true,
      projectLinks: true
    }
  });
}

// Activity Feed
export async function getActivityEvents(projectId: string, actorId: string, limit: number = 50, cursor?: string) {
  const workspace = await verifyWorkspaceAccess(projectId, actorId);
  const events = await prisma.activityEvent.findMany({
    where: { workspaceId: workspace.id },
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      workspace: {
        include: {
          project: {
            include: {
              projectMembers: {
                include: { user: { include: { profile: true } } }
              }
            }
          }
        }
      }
    }
  });

  let nextCursor: string | undefined = undefined;
  if (events.length > limit) {
    const nextItem = events.pop();
    nextCursor = nextItem?.id;
  }
  return { items: events, nextCursor };
}

// Tasks
export async function createTask(projectId: string, actorId: string, data: TaskInput) {
  const workspace = await verifyWorkspaceAccess(projectId, actorId);
  const parsed = taskSchema.parse(data);

  const task = await prisma.task.create({
    data: {
      workspaceId: workspace.id,
      title: parsed.title,
      status: parsed.status,
      assigneeId: parsed.assigneeId
    }
  });

  await prisma.activityEvent.create({
    data: {
      workspaceId: workspace.id,
      actorId,
      type: 'task_created',
      metadata: { taskId: task.id, title: task.title }
    }
  });

  return task;
}

export async function updateTask(projectId: string, actorId: string, taskId: string, data: TaskInput) {
  const workspace = await verifyWorkspaceAccess(projectId, actorId);
  const parsed = taskSchema.parse(data);

  const existing = await prisma.task.findFirst({
    where: { id: taskId, workspaceId: workspace.id }
  });
  if (!existing) throw new NotFoundError('Task not found');

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      title: parsed.title,
      status: parsed.status,
      assigneeId: parsed.assigneeId
    }
  });

  if (existing.status !== updated.status) {
    await prisma.activityEvent.create({
      data: {
        workspaceId: workspace.id,
        actorId,
        type: 'task_updated',
        metadata: { taskId: updated.id, title: updated.title, oldStatus: existing.status, newStatus: updated.status }
      }
    });

    if (updated.status === 'done') {
      // Fire notification asynchronously
      createNotification(actorId, 'PROJECT_ACTIVITY', {
        event: 'task_completed',
        projectId,
        taskId: updated.id,
        title: updated.title
      }).catch(console.error);
    }
  }

  return updated;
}

export async function deleteTask(projectId: string, actorId: string, taskId: string) {
  const workspace = await verifyWorkspaceAccess(projectId, actorId);
  const existing = await prisma.task.findFirst({
    where: { id: taskId, workspaceId: workspace.id }
  });
  if (!existing) throw new NotFoundError('Task not found');

  await prisma.task.delete({ where: { id: taskId } });
  return { success: true };
}

// Milestones
export async function createMilestone(projectId: string, actorId: string, data: MilestoneInput) {
  const workspace = await verifyWorkspaceAccess(projectId, actorId);
  const parsed = milestoneSchema.parse(data);

  return prisma.milestone.create({
    data: {
      workspaceId: workspace.id,
      title: parsed.title,
      targetDate: parsed.targetDate ? new Date(parsed.targetDate) : null,
      completedAt: parsed.completedAt ? new Date(parsed.completedAt) : null
    }
  });
}

export async function updateMilestone(projectId: string, actorId: string, milestoneId: string, data: MilestoneInput) {
  const workspace = await verifyWorkspaceAccess(projectId, actorId);
  const parsed = milestoneSchema.parse(data);

  const existing = await prisma.milestone.findFirst({
    where: { id: milestoneId, workspaceId: workspace.id }
  });
  if (!existing) throw new NotFoundError('Milestone not found');

  const completedAtDate = parsed.completedAt ? new Date(parsed.completedAt) : null;
  const updated = await prisma.milestone.update({
    where: { id: milestoneId },
    data: {
      title: parsed.title,
      targetDate: parsed.targetDate ? new Date(parsed.targetDate) : null,
      completedAt: completedAtDate
    }
  });

  if (!existing.completedAt && updated.completedAt) {
    await prisma.activityEvent.create({
      data: {
        workspaceId: workspace.id,
        actorId,
        type: 'milestone_completed',
        metadata: { milestoneId: updated.id, title: updated.title }
      }
    });

    createNotification(actorId, 'PROJECT_ACTIVITY', {
      event: 'milestone_completed',
      projectId,
      milestoneId: updated.id,
      title: updated.title
    }).catch(console.error);
  }

  return updated;
}

export async function deleteMilestone(projectId: string, actorId: string, milestoneId: string) {
  const workspace = await verifyWorkspaceAccess(projectId, actorId);
  const existing = await prisma.milestone.findFirst({
    where: { id: milestoneId, workspaceId: workspace.id }
  });
  if (!existing) throw new NotFoundError('Milestone not found');

  await prisma.milestone.delete({ where: { id: milestoneId } });
  return { success: true };
}

// Project Links
export async function createProjectLink(projectId: string, actorId: string, data: ProjectLinkInput) {
  const workspace = await verifyWorkspaceAccess(projectId, actorId);
  const parsed = projectLinkSchema.parse(data);

  return prisma.projectLink.create({
    data: {
      workspaceId: workspace.id,
      label: parsed.label,
      url: parsed.url
    }
  });
}

export async function deleteProjectLink(projectId: string, actorId: string, linkId: string) {
  const workspace = await verifyWorkspaceAccess(projectId, actorId);
  const existing = await prisma.projectLink.findFirst({
    where: { id: linkId, workspaceId: workspace.id }
  });
  if (!existing) throw new NotFoundError('Project link not found');

  await prisma.projectLink.delete({ where: { id: linkId } });
  return { success: true };
}
