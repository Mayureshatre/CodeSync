import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '../../../../../../src/lib/auth';
import { markAsRead } from '../../../../../../src/server/services/notificationService';
import { NotFoundError, ForbiddenError } from '../../../../../../src/server/errors';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const notification = await markAsRead(session.user.id, params.id);
    return NextResponse.json({ data: notification });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: (error as Error).message }, { status: 404 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: (error as Error).message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
