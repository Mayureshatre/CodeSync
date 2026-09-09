import { NextResponse } from 'next/server';
import { getCurrentSession } from '../../../../src/lib/auth';
import { searchDevelopers } from '../../../../src/server/services/discoveryService';
import { developerSearchSchema } from '../../../../src/lib/validations/discovery';
import { DomainError } from '../../../../src/server/errors';

export async function GET(req: Request) {
  try {
    const session = await getCurrentSession();
    const userId = session?.user?.id || null;

    const { searchParams } = new URL(req.url);
    const input: Record<string, any> = {};

    searchParams.forEach((value, key) => {
      if (['skills', 'experience', 'availability', 'projectInterests'].includes(key)) {
        if (!input[key]) input[key] = [];
        input[key].push(value);
      } else {
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

    const results = await searchDevelopers(userId, parsed.data);
    return NextResponse.json(results, { status: 200 });
  } catch (error: any) {
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
