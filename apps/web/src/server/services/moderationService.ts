import { prisma } from '../db';
import { ForbiddenError, NotFoundError, ConflictError, ValidationError } from '../errors';
import { CreateReportInput, createReportSchema } from '../../lib/validations/report';

export async function createReport(reporterId: string, input: CreateReportInput) {
  if (!reporterId) {
    throw new ForbiddenError('Authentication required');
  }

  const validated = createReportSchema.parse(input);

  // Validate target existence and self-reporting prevention
  if (validated.targetType === 'user') {
    if (validated.targetId === reporterId) {
      throw new ForbiddenError('Cannot report yourself');
    }
    const targetUser = await prisma.user.findUnique({ where: { id: validated.targetId } });
    if (!targetUser) {
      throw new NotFoundError('Target user not found');
    }
  } else if (validated.targetType === 'project') {
    const project = await prisma.project.findUnique({ where: { id: validated.targetId } });
    if (!project) {
      throw new NotFoundError('Target project not found');
    }
    if (project.ownerId === reporterId) {
      throw new ForbiddenError('Cannot report your own project');
    }
  } else if (validated.targetType === 'message') {
    const message = await prisma.message.findUnique({ where: { id: validated.targetId } });
    if (!message) {
      throw new NotFoundError('Target message not found');
    }
    if (message.senderId === reporterId) {
      throw new ForbiddenError('Cannot report your own message');
    }
  }

  // Prevent duplicate open reports from the same reporter on the same target
  const existingReport = await prisma.report.findFirst({
    where: {
      reporterId,
      targetType: validated.targetType,
      targetId: validated.targetId,
      status: 'open',
    },
  });

  if (existingReport) {
    throw new ConflictError('You already have an open report for this item');
  }

  // Format reason to include optional description
  const formattedReason = validated.description?.trim()
    ? `${validated.reason}: ${validated.description.trim()}`
    : validated.reason;

  return prisma.$transaction(async (tx) => {
    const report = await tx.report.create({
      data: {
        reporterId,
        targetType: validated.targetType,
        targetId: validated.targetId,
        reason: formattedReason,
        status: 'open',
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: reporterId,
        action: 'report_created',
        entityType: 'report',
        entityId: report.id,
        metadata: {
          targetType: validated.targetType,
          targetId: validated.targetId,
          reasonCategory: validated.reason,
        },
      },
    });

    return report;
  });
}
