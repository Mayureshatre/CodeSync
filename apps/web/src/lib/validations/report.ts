import { z } from 'zod';

export const reportReasons = ['spam', 'harassment', 'inappropriate_content', 'other'] as const;
export const reportTargetTypes = ['user', 'project', 'message'] as const;

export const createReportSchema = z.object({
  targetType: z.enum(reportTargetTypes),
  targetId: z.string().min(1, 'Target ID is required'),
  reason: z.string().min(1, 'Reason is required'),
  description: z.string().max(1000).optional(),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
