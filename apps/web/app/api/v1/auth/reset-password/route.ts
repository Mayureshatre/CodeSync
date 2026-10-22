import { NextResponse } from 'next/server';
import { resetPassword } from '@/src/server/services/authService';
import { resetPasswordSchema } from '@/src/lib/validations/auth';
import { DomainError } from '@/src/server/errors';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      const issues = parsed.error.issues.map(i => i.message);
      return NextResponse.json({ error: issues[0] || 'Invalid input' }, { status: 400 });
    }

    await resetPassword(parsed.data.token, parsed.data.password);

    return NextResponse.json({
      message: 'Your password has been reset successfully. Please sign in with your new password.'
    }, { status: 200 });
  } catch (error: any) {
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Reset password route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
