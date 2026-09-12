import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '../../../../../../src/lib/auth';
import { markConversationAsRead } from '../../../../../../src/server/services/messagingService';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updated = await markConversationAsRead(session.user.id, params.id);
    return NextResponse.json({ data: updated });
  } catch (error: any) {
    if (error.name === 'ForbiddenError' || error.name === 'NotFoundError') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
