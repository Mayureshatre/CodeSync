import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { respondToInvitation } from '../../../../../src/server/services/invitationService';
import { DomainError } from '../../../../../src/server/errors';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const body = await req.json();
    
    const invitation = await respondToInvitation(session.user.id, params.id, body);
    return NextResponse.json({ data: invitation });
  } catch (error: any) {
    if (error instanceof DomainError) {
      return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.statusCode });
    }
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input', field_errors: error.errors } }, { status: 400 });
    }
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } }, { status: 500 });
  }
}
