import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '../../../../../../../../src/lib/auth';
import { deleteProjectLink } from '../../../../../../../../src/server/services/workspaceService';

export async function DELETE(req: NextRequest, { params }: { params: { id: string, linkId: string } }) {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await deleteProjectLink(params.id, session.user.id, params.linkId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.name === 'NotFoundError') return NextResponse.json({ error: error.message }, { status: 404 });
    if (error.name === 'ForbiddenError') return NextResponse.json({ error: error.message }, { status: 403 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
