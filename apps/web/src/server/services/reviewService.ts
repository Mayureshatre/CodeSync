import { prisma } from '../db';
import { NotFoundError, ForbiddenError, ConflictError } from '../errors';
import { SubmitReviewInput, submitReviewSchema } from '../../lib/validations/review';
import { enqueueReviewVisibility } from '@codesync/core/queue';
import { getReviewVisibilityWindowDays } from './configService';
import { createNotification } from './notificationService';

export async function submitReview(projectId: string, reviewerId: string, data: SubmitReviewInput) {
  const parsed = submitReviewSchema.parse(data);

  if (reviewerId === parsed.revieweeId) {
    throw new ConflictError('Cannot review yourself');
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new NotFoundError('Project not found');

  if (project.status !== 'completed') {
    throw new ForbiddenError('Project must be completed to submit reviews');
  }

  // Ensure reviewer was part of the project
  const reviewerMember = await prisma.projectMember.findFirst({
    where: { projectId, userId: reviewerId }
  });
  const isReviewerOwner = project.ownerId === reviewerId;
  if (!reviewerMember && !isReviewerOwner) {
    throw new ForbiddenError('You must be a participant of this project to submit a review');
  }

  // Ensure reviewee was part of the project
  const revieweeMember = await prisma.projectMember.findFirst({
    where: { projectId, userId: parsed.revieweeId }
  });
  const isRevieweeOwner = project.ownerId === parsed.revieweeId;
  if (!revieweeMember && !isRevieweeOwner) {
    throw new ForbiddenError('Reviewee must be a participant of this project');
  }

  const existingReview = await prisma.review.findFirst({
    where: { projectId, reviewerId, revieweeId: parsed.revieweeId }
  });
  if (existingReview) {
    throw new ConflictError('You have already reviewed this participant for this project');
  }

  const counterpartReview = await prisma.review.findFirst({
    where: { projectId, reviewerId: parsed.revieweeId, revieweeId: reviewerId }
  });

  const review = await prisma.review.create({
    data: {
      projectId,
      reviewerId,
      revieweeId: parsed.revieweeId,
      rating: parsed.rating,
      comment: parsed.comment,
      visibleAt: counterpartReview ? new Date() : null
    }
  });

  if (counterpartReview) {
    // Both sides submitted. Make counterpart visible immediately too.
    await prisma.review.update({
      where: { id: counterpartReview.id },
      data: { visibleAt: new Date() }
    });

    // Notify both that reviews are visible
    createNotification(parsed.revieweeId, 'PROJECT_ACTIVITY', {
      event: 'review_visible', projectId, reviewId: review.id, reviewerId
    }).catch(console.error);

    createNotification(reviewerId, 'PROJECT_ACTIVITY', {
      event: 'review_visible', projectId, reviewId: counterpartReview.id, reviewerId: parsed.revieweeId
    }).catch(console.error);
  } else {
    // Schedule delayed visibility
    const windowDays = await getReviewVisibilityWindowDays();
    const delayMs = windowDays * 24 * 60 * 60 * 1000;
    
    await enqueueReviewVisibility(review.id, delayMs);

    createNotification(parsed.revieweeId, 'PROJECT_ACTIVITY', {
      event: 'review_received_hidden', projectId, reviewId: review.id, reviewerId
    }).catch(console.error);
  }

  return review;
}

export async function getReviewsForProject(projectId: string) {
  return prisma.review.findMany({
    where: {
      projectId,
      visibleAt: { not: null, lte: new Date() }
    },
    include: { reviewer: { include: { profile: true } } },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getReviewsForUser(userId: string) {
  return prisma.review.findMany({
    where: {
      revieweeId: userId,
      visibleAt: { not: null, lte: new Date() }
    },
    include: { reviewer: { include: { profile: true } }, project: true },
    orderBy: { createdAt: 'desc' }
  });
}
