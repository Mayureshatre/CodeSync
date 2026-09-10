import { z } from 'zod';

export const NotificationCategoryEnum = z.enum([
  'PROJECT_MATCH',
  'APPLICATION',
  'INVITATION',
  'MESSAGE',
  'PROJECT_ACTIVITY',
  'PLATFORM_UPDATE',
  'SYSTEM'
]);

export const NotificationChannelEnum = z.enum([
  'IN_APP',
  'EMAIL'
]);

export const NotificationPreferenceSchema = z.object({
  category: NotificationCategoryEnum,
  channel: NotificationChannelEnum,
  enabled: z.boolean()
});

export const UpdatePreferenceInputSchema = NotificationPreferenceSchema;

export type NotificationCategory = z.infer<typeof NotificationCategoryEnum>;
export type NotificationChannel = z.infer<typeof NotificationChannelEnum>;
export type NotificationPreference = z.infer<typeof NotificationPreferenceSchema>;

// Defines the default state for preferences if not explicitly set in the database
export const DEFAULT_PREFERENCES: Record<NotificationCategory, Record<NotificationChannel, boolean>> = {
  PROJECT_MATCH: { IN_APP: true, EMAIL: true },
  APPLICATION: { IN_APP: true, EMAIL: true },
  INVITATION: { IN_APP: true, EMAIL: true },
  MESSAGE: { IN_APP: true, EMAIL: true },
  PROJECT_ACTIVITY: { IN_APP: true, EMAIL: true },
  PLATFORM_UPDATE: { IN_APP: true, EMAIL: true },
  SYSTEM: { IN_APP: true, EMAIL: true },
};

export const NotificationQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});

