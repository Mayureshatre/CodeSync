
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '../../../../../src/lib/auth';
import { updatePlatformConfig, getAdminConfigs } from '../../../../../src/server/services/adminService';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const configs = await getAdminConfigs({ id: session.user.id, role: (session.user as any).role as string });
    return NextResponse.json({ data: configs });
  } catch (error: any) {
    if (error.name === 'ForbiddenError') return NextResponse.json({ error: error.message }, { status: 403 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    if (!body.key || body.value === undefined) {
      return NextResponse.json({ error: 'Key and value required' }, { status: 400 });
    }

    const config = await updatePlatformConfig({ id: session.user.id, role: (session.user as any).role as string }, body.key, String(body.value));
    return NextResponse.json({ data: config });
  } catch (error: any) {
    if (error.name === 'ForbiddenError') return NextResponse.json({ error: error.message }, { status: 403 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
