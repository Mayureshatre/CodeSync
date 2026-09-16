import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentSession } from '../../../../../src/lib/auth';
import { authorizeRealtimeChannel } from '../../../../../src/server/services/realtimeService';
import { ForbiddenError, ValidationError } from '../../../../../src/server/errors';

const authSchema = z.object({
  channelName: z.string().min(1)
});

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { channelName } = authSchema.parse(body);

    const tokenRequest = await authorizeRealtimeChannel(session.user.id, channelName);
    
    return NextResponse.json(tokenRequest);
  } catch (error: any) {
    console.error('Realtime Auth Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 });
    }
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
