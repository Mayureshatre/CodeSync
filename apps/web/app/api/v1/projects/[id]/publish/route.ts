import { NextResponse } from 'next/server';
import { getCurrentSession } from '../../../../../../src/lib/auth';
import { publishProject } from '../../../../../../src/server/services/projectService';
import { DomainError } from '../../../../../../src/server/errors';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const project = await publishProject(session.user.id, params.id);
    return NextResponse.json({ project }, { status: 200 });
  } catch (error: any) {
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
