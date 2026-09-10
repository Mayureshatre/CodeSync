import { NextResponse } from 'next/server';
import { getCurrentSession } from '../../../../../src/lib/auth';
import { getProjectsByOwner } from '../../../../../src/server/services/projectService';
import { DomainError } from '../../../../../src/server/errors';

export async function GET(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projects = await getProjectsByOwner(session.user.id);
    return NextResponse.json({ projects }, { status: 200 });
  } catch (error: any) {
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
