import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/lib/auth';
import { restoreAccount } from '@/src/server/services/accountService';
import { verifyCredentials } from '@/src/server/services/authService';
import { DomainError } from '@/src/server/errors';
import { z } from 'zod';

const unauthRestoreSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    let userId: string | null = session?.user?.id || null;

    if (!userId) {
      // Allow restore from login screen with credentials
      try {
        const body = await req.json();
        const parsed = unauthRestoreSchema.safeParse(body);
        if (parsed.success) {
          const user = await verifyCredentials(parsed.data.email, parsed.data.password);
          userId = user.id;
        }
      } catch {
        // No body or invalid JSON
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await restoreAccount(userId);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
