import { prisma } from '../db';
import { ForbiddenError, NotFoundError, ConflictError, ValidationError, sanitizeErrorMessage } from '../errors';
import { getMatchingQueue } from '@codesync/core/queue';
import { createNotification } from './notificationService';

type Actor = { id: string; role: string };

function requireModeratorOrAdmin(actor: Actor) {
  if (actor.role !== 'admin' && actor.role !== 'moderator') {
    throw new ForbiddenError('Admin or moderator privileges required');
  }
}

function requireAdmin(actor: Actor) {
  if (actor.role !== 'admin') {
    throw new ForbiddenError('Admin privileges required');
  }
}

export async function getReports(actor: Actor, limit = 50, cursor?: string) {
  requireModeratorOrAdmin(actor);

  const items = await prisma.report.findMany({
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    where: { status: 'open' },
    orderBy: { createdAt: 'asc' },
    include: { reporter: { select: { id: true, email: true, profile: { select: { username: true } } } } }
  });

  let nextCursor: string | undefined = undefined;
  if (items.length > limit) {
    const nextItem = items.pop();
    nextCursor = nextItem!.id;
  }

  return { items, nextCursor };
}

export async function resolveReport(actor: Actor, reportId: string, status: 'actioned' | 'dismissed', resolutionNotes: string) {
  requireModeratorOrAdmin(actor);

  if (!resolutionNotes || resolutionNotes.trim().length === 0) {
    throw new ConflictError('Resolution notes are required');
  }

  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) throw new NotFoundError('Report not found');
  if (report.status !== 'open') throw new ConflictError('Report is already resolved');

  return prisma.$transaction(async (tx) => {
    const updated = await tx.report.update({
      where: { id: reportId },
      data: { status, resolutionNotes }
    });

    await tx.adminAction.create({
      data: {
        adminId: actor.id,
        actionType: `report_${status}`,
        targetType: 'report',
        targetId: reportId,
        notes: resolutionNotes
      }
    });

    await tx.auditLog.create({
      data: {
        actorId: actor.id,
        action: `report_${status}`,
        entityType: 'report',
        entityId: reportId,
        metadata: { status, resolutionNotes }
      }
    });

    // Notify the reporter
    await createNotification(report.reporterId, 'SYSTEM', {
      event: 'report_resolved',
      reportId: report.id,
      resolution: status
    });

    return updated;
  });
}

export async function suspendUser(actor: Actor, userId: string, reason: string) {
  requireModeratorOrAdmin(actor);
  
  if (actor.id === userId) {
    throw new ForbiddenError('Cannot suspend yourself');
  }

  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) throw new NotFoundError('User not found');
  
  // Protect admins from being suspended by moderators
  if (targetUser.role === 'admin' && actor.role !== 'admin') {
    throw new ForbiddenError('Cannot suspend an admin');
  }
  // Protect moderators from being suspended by other moderators (optional, but good practice per SRS/RBAC)
  if (targetUser.role === 'moderator' && actor.role !== 'admin') {
    throw new ForbiddenError('Only admins can suspend moderators');
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: userId },
      data: { 
        status: 'suspended',
        sessionVersion: { increment: 1 } // Invalidate sessions immediately
      }
    });

    await tx.adminAction.create({
      data: {
        adminId: actor.id,
        actionType: 'suspend_user',
        targetType: 'user',
        targetId: userId,
        notes: reason
      }
    });

    await tx.auditLog.create({
      data: {
        actorId: actor.id,
        action: 'suspend_user',
        entityType: 'user',
        entityId: userId,
        metadata: { reason }
      }
    });

    return updated;
  });
}

export async function toggleProjectModeration(actor: Actor, projectId: string, hidden: boolean, reason: string) {
  requireModeratorOrAdmin(actor);

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new NotFoundError('Project not found');

  return prisma.$transaction(async (tx) => {
    const updated = await tx.project.update({
      where: { id: projectId },
      data: { moderationHidden: hidden }
    });

    await tx.adminAction.create({
      data: {
        adminId: actor.id,
        actionType: hidden ? 'hide_project' : 'unhide_project',
        targetType: 'project',
        targetId: projectId,
        notes: reason
      }
    });

    await tx.auditLog.create({
      data: {
        actorId: actor.id,
        action: hidden ? 'hide_project' : 'unhide_project',
        entityType: 'project',
        entityId: projectId,
        metadata: { reason }
      }
    });

    return updated;
  });
}

export async function getPendingSkills(actor: Actor) {
  requireModeratorOrAdmin(actor);
  return prisma.skill.findMany({
    where: { status: 'pending' },
    orderBy: { name: 'asc' }
  });
}

export async function resolvePendingSkill(actor: Actor, skillId: string, action: 'approve' | 'reject' | 'merge', targetSkillId?: string) {
  requireModeratorOrAdmin(actor);

  const skill = await prisma.skill.findUnique({ where: { id: skillId } });
  if (!skill) throw new NotFoundError('Skill not found');
  if (skill.status !== 'pending') throw new ConflictError('Skill is not pending');

  if (action === 'merge') {
    if (!targetSkillId) throw new ConflictError('Target skill ID required for merge');
    if (skillId === targetSkillId) throw new ConflictError('Cannot merge skill into itself');
    
    const targetSkill = await prisma.skill.findUnique({ where: { id: targetSkillId } });
    if (!targetSkill) throw new NotFoundError('Target skill not found');
  }

  return prisma.$transaction(async (tx) => {
    if (action === 'approve') {
      await tx.skill.update({ where: { id: skillId }, data: { status: 'approved' } });
    } else if (action === 'reject') {
      await tx.skill.delete({ where: { id: skillId } });
    } else if (action === 'merge' && targetSkillId) {
      // Safely remap UserSkill
      const userSkills = await tx.userSkill.findMany({ where: { skillId } });
      for (const us of userSkills) {
        const existing = await tx.userSkill.findUnique({ where: { userId_skillId: { userId: us.userId, skillId: targetSkillId } } });
        if (!existing) {
          await tx.userSkill.update({ where: { id: us.id }, data: { skillId: targetSkillId } });
        } else {
          await tx.userSkill.delete({ where: { id: us.id } }); // User already has target skill, safely drop the alias
        }
      }

      // Safely remap ProjectSkill
      const projectSkills = await tx.projectSkill.findMany({ where: { skillId } });
      for (const ps of projectSkills) {
        const existing = await tx.projectSkill.findUnique({ where: { projectId_skillId: { projectId: ps.projectId, skillId: targetSkillId } } });
        if (!existing) {
          await tx.projectSkill.update({ where: { id: ps.id }, data: { skillId: targetSkillId } });
        } else {
          await tx.projectSkill.delete({ where: { id: ps.id } });
        }
      }

      // Safely remap ProjectRoleSkill
      const projectRoleSkills = await tx.projectRoleSkill.findMany({ where: { skillId } });
      for (const prs of projectRoleSkills) {
        const existing = await tx.projectRoleSkill.findUnique({ where: { projectRoleId_skillId: { projectRoleId: prs.projectRoleId, skillId: targetSkillId } } });
        if (!existing) {
          await tx.projectRoleSkill.update({ where: { id: prs.id }, data: { skillId: targetSkillId } });
        } else {
          await tx.projectRoleSkill.delete({ where: { id: prs.id } });
        }
      }
      
      // Update aliases
      await tx.skill.update({
        where: { id: targetSkillId },
        data: { aliases: { push: skill.name } }
      });

      // Finally delete the pending skill
      await tx.skill.delete({ where: { id: skillId } });
    }

    await tx.adminAction.create({
      data: {
        adminId: actor.id,
        actionType: `skill_${action}`,
        targetType: 'skill',
        targetId: skillId,
        notes: action === 'merge' ? `Merged into ${targetSkillId}` : undefined
      }
    });

    await tx.auditLog.create({
      data: {
        actorId: actor.id,
        action: `skill_${action}`,
        entityType: 'skill',
        entityId: skillId,
        metadata: action === 'merge' ? { targetSkillId } : {}
      }
    });

    return { success: true };
  });
}

export async function updatePlatformConfig(actor: Actor, key: string, value: string) {
  requireAdmin(actor);

  const updated = await prisma.platformConfig.upsert({
    where: { key },
    update: { value, updatedBy: actor.id },
    create: { key, value, updatedBy: actor.id }
  });

  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      action: 'update_config',
      entityType: 'platform_config',
      entityId: key,
      metadata: { newValue: value }
    }
  });

  return updated;
}


export async function getAdminUsers(actor: Actor, q?: string, limit = 50, cursor?: string) {
  requireModeratorOrAdmin(actor);
  const where = q ? {
    OR: [
      { email: { contains: q, mode: 'insensitive' as const } },
      { profile: { displayName: { contains: q, mode: 'insensitive' as const } } }
    ]
  } : {};
  
  const items = await prisma.user.findMany({
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    where,
    orderBy: { createdAt: 'desc' },
    select: { id: true, email: true, status: true, role: true, createdAt: true, profile: { select: { displayName: true } } }
  });
  let nextCursor: string | undefined = undefined;
  if (items.length > limit) {
    nextCursor = items.pop()!.id;
  }
  return { items, nextCursor };
}

export async function getAdminProjects(actor: Actor, q?: string, limit = 50, cursor?: string) {
  requireModeratorOrAdmin(actor);
  const where = q ? { name: { contains: q, mode: 'insensitive' as const } } : {};
  const items = await prisma.project.findMany({
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    where,
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, status: true, moderationHidden: true, createdAt: true, owner: { select: { email: true } } }
  });
  let nextCursor: string | undefined = undefined;
  if (items.length > limit) {
    nextCursor = items.pop()!.id;
  }
  return { items, nextCursor };
}

export async function getAdminConfigs(actor: Actor) {
  requireAdmin(actor);
  return prisma.platformConfig.findMany({
    orderBy: { key: 'asc' }
  });
}

export const SMOKE_TEST_JOB_ID_REGEX = /^smoke-test-\d+-[a-z0-9]+$/;

let lastSmokeTestTimestamp = 0;
const SMOKE_TEST_DEBOUNCE_MS = 5000;

export function _resetLastSmokeTestTimestampForTesting() {
  lastSmokeTestTimestamp = 0;
}

export async function enqueueMatchingQueueSmokeTest(actor: Actor): Promise<{ jobId: string }> {
  requireAdmin(actor);

  const now = Date.now();
  if (now - lastSmokeTestTimestamp < SMOKE_TEST_DEBOUNCE_MS) {
    throw new ConflictError('A smoke test was enqueued recently. Please wait a few seconds before triggering another.');
  }

  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const jobId = `smoke-test-${now}-${randomSuffix}`;

  try {
    const queue = getMatchingQueue();
    // Strictly hardcode job name to 'recompute' and payload to {}
    const job = await queue.add(
      'recompute',
      {},
      {
        jobId,
        attempts: 1,
        removeOnComplete: { age: 300 }, // Retain completed job metadata for 5 minutes
        removeOnFail: { age: 300 },     // Retain failed job metadata for 5 minutes
      }
    );

    lastSmokeTestTimestamp = now;

    return { jobId: job.id || jobId };
  } catch (error: any) {
    throw new Error(`Queue operation failed: ${sanitizeErrorMessage(error?.message || String(error))}`);
  }
}

export async function getMatchingQueueSmokeTestStatus(actor: Actor, jobId: string) {
  requireAdmin(actor);

  if (!jobId || !SMOKE_TEST_JOB_ID_REGEX.test(jobId)) {
    throw new ValidationError('Invalid smoke-test job ID format. Must match smoke-test-<timestamp>-<suffix>');
  }

  const queue = getMatchingQueue();
  const job = await queue.getJob(jobId);

  if (!job) {
    throw new NotFoundError(`Smoke test job ${jobId} not found or expired from matching queue.`);
  }

  const state = await job.getState();

  return {
    jobId: job.id || jobId,
    name: job.name,
    state,
    timestamp: job.timestamp,
    processedOn: job.processedOn ?? null,
    finishedOn: job.finishedOn ?? null,
  };
}
