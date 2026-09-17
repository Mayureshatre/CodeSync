import { NextResponse } from 'next/server';
import { resendVerificationEmail } from '../../../../../src/server/services/authService';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.email || typeof body.email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Always wait for the same roughly arbitrary time to prevent timing attacks?
    // Not strictly necessary since the service handles rate limiting and exits quickly.
    await resendVerificationEmail(body.email);

    // Return generic success regardless of outcome to prevent email enumeration
    return NextResponse.json({ message: 'If that email address is registered and unverified, a verification link has been sent.' });
  } catch (error: any) {
    console.error('Resend verification route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
