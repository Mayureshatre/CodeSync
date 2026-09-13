
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '../../../../../../../src/lib/auth';
import { resolveReport } from '../../../../../../../src/server/services/adminService';
import { resolveReportSchema } from '../../../../../../../src/lib/validations/admin';
import { z } from 'zod';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = resolveReportSchema.parse(body);

    const report = await resolveReport({ id: session.user.id, role: (session.user as any).role as string }, params.id, parsed.status, parsed.resolutionNotes);
    return NextResponse.json({ data: report });
  } catch (error: any) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues }, { status: 400 });
    if (error.name === 'ForbiddenError') return NextResponse.json({ error: error.message }, { status: 403 });
    if (error.name === 'NotFoundError') return NextResponse.json({ error: error.message }, { status: 404 });
    if (error.name === 'ConflictError') return NextResponse.json({ error: error.message }, { status: 409 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
