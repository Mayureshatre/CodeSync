import { prisma } from './db';
import { NotFoundError, ForbiddenError } from './errors';
import { 
  NotificationCategory, 
  NotificationChannel, 
  DEFAULT_PREFERENCES,
  NotificationCategoryEnum,
  NotificationChannelEnum
} from './notificationTypes';
import { Prisma } from '@prisma/client';

export async function createNotification(
  userId: string,
  type: NotificationCategory,
  payload: Prisma.InputJsonValue
) {
  // Always write to in-app notification first per AGENTS.md rule
  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      payload
    }
  });

  return notification;
}

export async function getNotifications(userId: string, cursor?: string, limit = 20) {
  const notifications = await prisma.notification.findMany({
    where: { userId },
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: 'desc' }
  });

  let nextCursor: typeof cursor | undefined = undefined;
  if (notifications.length > limit) {
    const nextItem = notifications.pop();
    nextCursor = nextItem?.id;
  }

  return {
    items: notifications,
    nextCursor
  };
}

export async function markAsRead(userId: string, notificationId: string) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId }
  });

  if (!notification) {
    throw new NotFoundError('Notification not found');
  }

  if (notification.userId !== userId) {
    throw new ForbiddenError('You do not have permission to modify this notification');
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { readAt: new Date() }
  });
}

export async function markAllAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { 
      userId,
      readAt: null
    },
    data: { readAt: new Date() }
  });
}

export async function getPreferences(userId: string) {
  const savedPreferences = await prisma.notificationPreference.findMany({
    where: { userId }
  });

  // Start with all defaults
  const resolvedPreferences: Record<string, Record<string, boolean>> = {};
  
  // Clone default preferences safely
  for (const [category, channels] of Object.entries(DEFAULT_PREFERENCES)) {
    resolvedPreferences[category as keyof typeof resolvedPreferences] = { ...(channels as any) };
  }

  // Override with saved user preferences
  for (const pref of savedPreferences) {
    const categoryPrefs = resolvedPreferences[pref.category];
    if (categoryPrefs !== undefined && categoryPrefs[pref.channel] !== undefined) {
      categoryPrefs[pref.channel] = pref.enabled;
    }
  }

  return resolvedPreferences;
}

export async function updatePreference(
  userId: string, 
  category: NotificationCategory, 
  channel: NotificationChannel, 
  enabled: boolean
) {
  return prisma.notificationPreference.upsert({
    where: {
      userId_category_channel: {
        userId,
        category,
        channel
      }
    },
    update: { enabled },
    create: {
      userId,
      category,
      channel,
      enabled
    }
  });
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({
    where: {
      userId,
      readAt: null
    }
  });
}
