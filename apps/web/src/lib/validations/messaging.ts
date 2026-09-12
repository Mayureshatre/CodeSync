import { z } from 'zod';

export const sendMessageSchema = z.object({
  body: z.string().min(1, 'Message cannot be empty').max(2000, 'Message is too long')
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export const getMessagesQuerySchema = z.object({
  cursor: z.string().optional(),
  since: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50)
});

export type GetMessagesQueryInput = z.infer<typeof getMessagesQuerySchema>;
