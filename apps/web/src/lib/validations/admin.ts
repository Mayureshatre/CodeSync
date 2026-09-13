import { z } from 'zod';

export const resolveReportSchema = z.object({
  status: z.enum(['actioned', 'dismissed']),
  resolutionNotes: z.string().min(1, 'Resolution notes are required'),
});

export const suspendUserSchema = z.object({
  reason: z.string().min(1, 'Reason is required'),
});

export const moderateProjectSchema = z.object({
  hidden: z.boolean(),
  reason: z.string().min(1, 'Reason is required'),
});

export const resolveSkillSchema = z.object({
  action: z.enum(['approve', 'reject', 'merge']),
  targetSkillId: z.string().optional(),
}).refine(data => {
  if (data.action === 'merge' && !data.targetSkillId) return false;
  return true;
}, { message: 'Target skill ID is required when merging' });
