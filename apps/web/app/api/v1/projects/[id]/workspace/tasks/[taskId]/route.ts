import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '../../../../../../../../src/lib/auth';
import { updateTask, deleteTask } from '../../../../../../../../src/server/services/workspaceService';
import { z } from 'zod';

export async function PUT(req: NextRequest, { params }: { params: { id: string, taskId: string } }) {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const task = await updateTask(params.id, session.user.id, params.taskId, body);
    return NextResponse.json({ data: task });
  } catch (error: any) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: (error as any).errors }, { status: 400 });
    if (error.name === 'NotFoundError') return NextResponse.json({ error: error.message }, { status: 404 });
    if (error.name === 'ForbiddenError') return NextResponse.json({ error: error.message }, { status: 403 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string, taskId: string } }) {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await deleteTask(params.id, session.user.id, params.taskId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.name === 'NotFoundError') return NextResponse.json({ error: error.message }, { status: 404 });
    if (error.name === 'ForbiddenError') return NextResponse.json({ error: error.message }, { status: 403 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
