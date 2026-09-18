import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '../../../../../src/lib/auth';
import { getPreferences, updatePreference } from '../../../../../src/server/services/notificationService';
import { UpdatePreferenceInputSchema } from '../../../../../src/lib/validations/notification';
import { z } from 'zod';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const preferences = await getPreferences(session.user.id);
    return NextResponse.json({ data: preferences });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsedData = UpdatePreferenceInputSchema.parse(body);

    const updatedPreference = await updatePreference(
      session.user.id,
      parsedData.category,
      parsedData.channel,
      parsedData.enabled
    );

    return NextResponse.json({ data: updatedPreference });
  } catch (error) {
    if (error instanceof z.ZodError || (error as any)?.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: (error as any).errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
