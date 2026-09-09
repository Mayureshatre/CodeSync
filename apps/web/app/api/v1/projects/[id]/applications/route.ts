import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { applyToProject, getApplicationsForProject } from '../../../../../../src/server/services/applicationService';
import { DomainError } from '../../../../../../src/server/errors';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const body = await req.json();
    const application = await applyToProject(session.user.id, params.id, body);
    
    return NextResponse.json({ data: application }, { status: 201 });
  } catch (error: any) {
    if (error instanceof DomainError) {
      return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.statusCode });
    }
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input', field_errors: error.errors } }, { status: 400 });
    }
    console.error('Apply to project error:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const applications = await getApplicationsForProject(session.user.id, params.id);
    return NextResponse.json({ data: applications });
  } catch (error: any) {
    if (error instanceof DomainError) {
      return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.statusCode });
    }
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } }, { status: 500 });
  }
}
