import { NextResponse } from 'next/server';
import { getCurrentSession } from '../../../../../src/lib/auth';
import { searchDevelopers } from '../../../../../src/server/services/discoveryService';
import { developerSearchSchema } from '../../../../../src/lib/validations/discovery';
import { DomainError } from '../../../../../src/server/errors';

export async function GET(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required to fetch recommended developers' }, { status: 400 });
    }

    const input: Record<string, any> = { sort: 'relevance', projectId };

    searchParams.forEach((value, key) => {
      if (['skills', 'experience', 'availability', 'projectInterests'].includes(key)) {
        if (!input[key]) input[key] = [];
        input[key].push(value);
      } else if (key !== 'sort' && key !== 'projectId') {
        input[key] = value;
      }
    });

    const parsed = developerSearchSchema.safeParse(input);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const results = await searchDevelopers(session.user.id, parsed.data);
    return NextResponse.json(results, { status: 200 });
  } catch (error: any) {
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
