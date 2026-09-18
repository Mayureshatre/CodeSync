import { Worker } from 'bullmq';
import { prisma } from '@codesync/core/db';
import { createNotification } from '@codesync/core/notificationService';

export function startReviewWorker(redisUrl: string) {
  const worker = new Worker('review', async (job) => {
    if (job.name === 'reveal-review') {
      const { reviewId } = job.data;
      if (!reviewId) return;

      const review = await prisma.review.findUnique({
        where: { id: reviewId }
      });

      if (!review) return;

      // Ensure idempotency: if already visible, do nothing.
      if (review.visibleAt) return;

      // Note: we don't need to recheck if counterpart arrived here,
      // because if counterpart arrived, it would have set visibleAt = now() on BOTH rows,
      // so the check above handles it.

      await prisma.review.update({
        where: { id: reviewId },
        data: { visibleAt: new Date() }
      });

      // Notify the reviewee that the delayed review is now visible
      await createNotification(review.revieweeId, 'PROJECT_ACTIVITY', {
        event: 'review_visible', 
        projectId: review.projectId, 
        reviewId: review.id, 
        reviewerId: review.reviewerId
      });
    }
  }, { connection: { url: redisUrl } });

  worker.on('failed', (job, err) => {
    console.error(`Review job ${job?.id} failed with error:`, err);
  });

  return worker;
}
