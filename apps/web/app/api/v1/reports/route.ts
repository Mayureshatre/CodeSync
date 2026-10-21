import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '../../../../src/lib/auth';
import { createReport } from '../../../../src/server/services/moderationService';
import { createReportSchema } from '../../../../src/lib/validations/report';
import { z } from 'zod';

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createReportSchema.parse(body);

    const report = await createReport(session.user.id, parsed);
    return NextResponse.json({ data: report }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError || error.name === 'ZodError') {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', details: (error as any).errors || (error as any).issues } }, { status: 400 });
    }
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: error.message } }, { status: 400 });
    }
    if (error.name === 'ForbiddenError') {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: error.message } }, { status: 403 });
    }
    if (error.name === 'NotFoundError') {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: error.message } }, { status: 404 });
    }
    if (error.name === 'ConflictError') {
      return NextResponse.json({ error: { code: 'CONFLICT', message: error.message } }, { status: 409 });
    }
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } }, { status: 500 });
  }
}
