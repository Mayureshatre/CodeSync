import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '../../../../src/lib/auth';
import { getNotifications, getUnreadCount } from '../../../../src/server/services/notificationService';
import { NotificationQuerySchema } from '../../../../src/lib/validations/notification';
import { z } from 'zod';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = {
      cursor: searchParams.get('cursor') || undefined,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined
    };

    const parsedQuery = NotificationQuerySchema.parse(query);

    const [notificationsResult, unreadCount] = await Promise.all([
      getNotifications(session.user.id, parsedQuery.cursor, parsedQuery.limit),
      getUnreadCount(session.user.id)
    ]);

    return NextResponse.json({
      data: notificationsResult.items,
      nextCursor: notificationsResult.nextCursor,
      unreadCount
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: (error as any).errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
