import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '../../../../../../src/lib/auth';
import { getMessages, sendMessage } from '../../../../../../src/server/services/messagingService';
import { sendMessageSchema, getMessagesQuerySchema } from '../../../../../../src/lib/validations/messaging';
import { z } from 'zod';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const queryParams = {
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
      cursor: searchParams.get('cursor') || undefined,
      since: searchParams.get('since') || undefined,
    };

    const parsedData = getMessagesQuerySchema.parse(queryParams);

    const messages = await getMessages(
      session.user.id,
      params.id,
      parsedData.limit,
      parsedData.cursor,
      parsedData.since
    );

    return NextResponse.json({ data: messages });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: (error as any).errors }, { status: 400 });
    }
    if (error.name === 'ForbiddenError' || error.name === 'NotFoundError') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsedData = sendMessageSchema.parse(body);

    const message = await sendMessage(session.user.id, params.id, parsedData);

    return NextResponse.json({ data: message });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: (error as any).errors }, { status: 400 });
    }
    if (error.name === 'ForbiddenError' || error.name === 'NotFoundError') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
