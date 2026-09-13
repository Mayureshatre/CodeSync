import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '../../../../../../src/lib/auth';
import { submitReview, getReviewsForProject } from '../../../../../../src/server/services/reviewService';
import { z } from 'zod';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const reviews = await getReviewsForProject(params.id);
    return NextResponse.json({ data: reviews });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const review = await submitReview(params.id, session.user.id, body);
    return NextResponse.json({ data: review });
  } catch (error: any) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: (error as any).errors }, { status: 400 });
    if (error.name === 'NotFoundError') return NextResponse.json({ error: error.message }, { status: 404 });
    if (error.name === 'ForbiddenError') return NextResponse.json({ error: error.message }, { status: 403 });
    if (error.name === 'ConflictError') return NextResponse.json({ error: error.message }, { status: 409 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
