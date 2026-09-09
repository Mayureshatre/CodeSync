import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getApplicationsForDeveloper } from '../../../../src/server/services/applicationService';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const applications = await getApplicationsForDeveloper(session.user.id);
    return NextResponse.json({ data: applications });
  } catch (error: any) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } }, { status: 500 });
  }
}
