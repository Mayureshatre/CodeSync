import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { updateApplicationStatus, withdrawApplication } from '../../../../../src/server/services/applicationService';
import { DomainError } from '../../../../../src/server/errors';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const body = await req.json();
    
    // Developer withdrawing
    if (body.status === 'withdrawn') {
      const application = await withdrawApplication(session.user.id, params.id);
      return NextResponse.json({ data: application });
    }
    
    // Owner updating status
    const application = await updateApplicationStatus(session.user.id, params.id, body);
    return NextResponse.json({ data: application });
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
