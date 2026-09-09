import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { removeSavedProject } from '@/src/server/services/savedItemService';
import { DomainError } from '@/src/server/errors';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    await removeSavedProject(session.user.id, params.id);
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    if (error instanceof DomainError) {
      return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.statusCode });
    }
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } }, { status: 500 });
  }
}
