
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '../../../../../src/lib/auth';
import { getAdminUsers } from '../../../../../src/server/services/adminService';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const url = new URL(req.url);
    const q = url.searchParams.get('q') || undefined;
    const cursor = url.searchParams.get('cursor') || undefined;
    const result = await getAdminUsers({ id: session.user.id, role: (session.user as any).role as string }, q, 50, cursor);
    return NextResponse.json({ data: result });
  } catch (error: any) {
    if (error.name === 'ForbiddenError') return NextResponse.json({ error: error.message }, { status: 403 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
