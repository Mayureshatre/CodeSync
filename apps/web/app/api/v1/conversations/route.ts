import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '../../../../src/lib/auth';
import { getUserConversations, createConversation } from '../../../../src/server/services/messagingService';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversations = await getUserConversations(session.user.id);
    return NextResponse.json({ data: conversations });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { targetUserId, projectId } = body;
    
    if (!targetUserId && !projectId) {
      return NextResponse.json({ error: 'Must specify targetUserId or projectId' }, { status: 400 });
    }

    const conversation = await createConversation(session.user.id, { targetUserId, projectId });
    return NextResponse.json({ data: conversation });
  } catch (error: any) {
    if (error.name === 'ForbiddenError' || error.name === 'NotFoundError') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
