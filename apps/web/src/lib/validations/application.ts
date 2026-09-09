import { z } from 'zod';

export const applyToProjectSchema = z.object({
  roleId: z.string().optional().nullable(),
  message: z.string().min(10, "Message must be at least 10 characters").max(1000, "Message must be at most 1000 characters"),
});

export const updateApplicationStatusSchema = z.object({
  status: z.enum(['under_review', 'shortlisted', 'interviewing', 'accepted', 'rejected', 'withdrawn']),
});

export type ApplyToProjectInput = z.infer<typeof applyToProjectSchema>;
export type UpdateApplicationStatusInput = z.infer<typeof updateApplicationStatusSchema>;
