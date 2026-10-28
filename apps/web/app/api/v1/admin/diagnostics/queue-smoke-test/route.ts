import { NextResponse } from 'next/server';
import { getCurrentSession } from '../../../../../../src/lib/auth';
import { enqueueMatchingQueueSmokeTest, getMatchingQueueSmokeTestStatus } from '../../../../../../src/server/services/adminService';
import { sanitizeErrorMessage } from '../../../../../../src/server/errors';

export const dynamic = 'force-dynamic';

function isAllowedOrigin(req: Request): boolean {
  const secFetchSite = req.headers.get('sec-fetch-site');
  if (secFetchSite === 'cross-site') {
    return false;
  }

  const origin = req.headers.get('origin');
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        return false;
      }
    } catch {
      return false;
    }
  }
  return true;
}

export async function POST(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAllowedOrigin(req)) {
      return NextResponse.json({ error: 'Forbidden: cross-origin requests are not allowed' }, { status: 403 });
    }

    const actor = {
      id: session.user.id,
      role: (session.user as any).role as string,
    };

    // Client-supplied body is intentionally ignored; payload is strictly fixed to {}
    const result = await enqueueMatchingQueueSmokeTest(actor);

    return NextResponse.json({
      success: true,
      message: 'Smoke test job enqueued successfully into matching queue.',
      queue: 'matching',
      jobId: result.jobId,
    }, { status: 200 });
  } catch (error: any) {
    if (error.name === 'ForbiddenError') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error.name === 'ConflictError') {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({
      error: sanitizeErrorMessage(error.message || 'Internal Server Error'),
    }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({ error: 'Missing jobId query parameter' }, { status: 400 });
    }

    const actor = {
      id: session.user.id,
      role: (session.user as any).role as string,
    };

    const result = await getMatchingQueueSmokeTestStatus(actor, jobId);

    return NextResponse.json({
      success: true,
      data: result,
    }, { status: 200 });
  } catch (error: any) {
    if (error.name === 'ForbiddenError') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error.name === 'NotFoundError') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({
      error: sanitizeErrorMessage(error.message || 'Internal Server Error'),
    }, { status: 500 });
  }
}
