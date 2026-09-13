
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '../../../../../../../src/lib/auth';
import { resolvePendingSkill } from '../../../../../../../src/server/services/adminService';
import { resolveSkillSchema } from '../../../../../../../src/lib/validations/admin';
import { z } from 'zod';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = resolveSkillSchema.parse(body);

    const result = await resolvePendingSkill({ id: session.user.id, role: (session.user as any).role as string }, params.id, parsed.action, parsed.targetSkillId);
    return NextResponse.json({ data: result });
  } catch (error: any) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues }, { status: 400 });
    if (error.name === 'ForbiddenError') return NextResponse.json({ error: error.message }, { status: 403 });
    if (error.name === 'NotFoundError') return NextResponse.json({ error: error.message }, { status: 404 });
    if (error.name === 'ConflictError') return NextResponse.json({ error: error.message }, { status: 409 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
