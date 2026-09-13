import { z } from 'zod';

export const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  status: z.enum(['todo', 'in_progress', 'done']).default('todo'),
  assigneeId: z.string().nullable().optional(),
});
export type TaskInput = z.infer<typeof taskSchema>;

export const milestoneSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  targetDate: z.string().datetime().nullable().optional(),
  completedAt: z.string().datetime().nullable().optional(),
});
export type MilestoneInput = z.infer<typeof milestoneSchema>;

export const projectLinkSchema = z.object({
  label: z.string().min(1, 'Label is required').max(100, 'Label is too long'),
  url: z.string().url('Must be a valid URL'),
});
export type ProjectLinkInput = z.infer<typeof projectLinkSchema>;
