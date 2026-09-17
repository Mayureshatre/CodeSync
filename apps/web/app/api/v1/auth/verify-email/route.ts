import { NextResponse } from 'next/server';
import { verifyEmailToken } from '../../../../../src/server/services/authService';
import { AuthenticationError, NotFoundError } from '../../../../../src/server/errors';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.token || typeof body.token !== 'string') {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    await verifyEmailToken(body.token);

    return NextResponse.json({ message: 'Email verified successfully' });
  } catch (error: any) {
    if (error instanceof AuthenticationError || error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
