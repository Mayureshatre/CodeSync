import { NextResponse } from 'next/server';
import { requestPasswordReset } from '@/src/server/services/authService';
import { forgotPasswordSchema } from '@/src/lib/validations/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Please provide a valid email address' }, { status: 400 });
    }

    await requestPasswordReset(parsed.data.email);

    // Always return generic success to prevent account enumeration
    return NextResponse.json({
      message: 'If an account exists with that email address, password reset instructions have been sent.'
    }, { status: 200 });
  } catch (error) {
    console.error('Forgot password route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
