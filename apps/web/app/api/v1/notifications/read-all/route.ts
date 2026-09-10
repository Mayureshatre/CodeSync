import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '../../../../../src/lib/auth';
import { markAllAsRead } from '../../../../../src/server/services/notificationService';

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await markAllAsRead(session.user.id);

    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
