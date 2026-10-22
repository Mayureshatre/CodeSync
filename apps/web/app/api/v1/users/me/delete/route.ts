import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/lib/auth';
import { requestAccountDeletion } from '@/src/server/services/accountService';
import { DomainError } from '@/src/server/errors';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await requestAccountDeletion(session.user.id);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
