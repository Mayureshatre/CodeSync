import { z } from 'zod';

export const saveProjectSchema = z.object({
  targetId: z.string().min(1, 'Project ID is required'),
});

export const saveDeveloperSchema = z.object({
  targetId: z.string().min(1, 'Developer ID is required'),
});

export const saveSearchSchema = z.object({
  queryParams: z.record(z.string(), z.any()).refine(obj => Object.keys(obj).length > 0, {
    message: 'Search parameters cannot be empty',
  }),
  alertEnabled: z.boolean().optional().default(false),
});

export type SaveProjectInput = z.infer<typeof saveProjectSchema>;
export type SaveDeveloperInput = z.infer<typeof saveDeveloperSchema>;
export type SaveSearchInput = z.infer<typeof saveSearchSchema>;
