import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/lib/auth';
import { finalizeResumeUpload, getResumeDownloadUrl, deleteResume } from '@/src/server/services/resumeService';
import { NotFoundError } from '@/src/server/errors';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await getResumeDownloadUrl(session.user.id);
    return NextResponse.json(result);
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('Get resume error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { key } = await req.json();

    if (!key || typeof key !== 'string') {
      return NextResponse.json({ error: 'Missing object key' }, { status: 400 });
    }

    // Security: ensure the key starts with the user's isolated path
    if (!key.startsWith(`resumes/${session.user.id}/`)) {
      return NextResponse.json({ error: 'Invalid object key' }, { status: 403 });
    }

    const result = await finalizeResumeUpload(session.user.id, key);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Finalize resume error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await deleteResume(session.user.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('Delete resume error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
