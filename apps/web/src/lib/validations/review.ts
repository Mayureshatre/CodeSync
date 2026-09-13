import { z } from 'zod';

export const submitReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1, 'Comment is required').max(1000, 'Comment is too long'),
  revieweeId: z.string().min(1, 'Reviewee is required'),
});

export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;
