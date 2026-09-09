import { z } from 'zod';

export const inviteDeveloperSchema = z.object({
  invitedUserId: z.string().min(1, 'Developer ID is required'),
  roleId: z.string().optional().nullable(),
  matchScoreSnapshot: z.number().min(0).max(100),
  reasonSnapshot: z.any(),
});

export const respondToInvitationSchema = z.object({
  action: z.enum(['accept', 'decline']),
});

export type InviteDeveloperInput = z.infer<typeof inviteDeveloperSchema>;
export type RespondToInvitationInput = z.infer<typeof respondToInvitationSchema>;
