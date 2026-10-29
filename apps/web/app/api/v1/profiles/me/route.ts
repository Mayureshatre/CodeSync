import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/lib/auth';
import { getProfileByUserId, updateProfile, calculateProfileCompleteness } from '@/src/server/services/profileService';
import { profileSchema } from '@/src/lib/validations/profile';
import { DomainError } from '@/src/server/errors';

// [TEMP-DIAG] Logs safe Prisma connection-string facts to Vercel logs.
// Never logs the URL, hostname, username, password, or query string.
// Remove this function and its two call sites once the 42P05 investigation is complete.
function logDbConfigFacts(caller: string): void {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    console.log(`[TEMP-DIAG][${caller}] DATABASE_URL is not set in this runtime.`);
    return;
  }
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    console.log(`[TEMP-DIAG][${caller}] DATABASE_URL is set but failed URL parsing — likely malformed.`);
    return;
  }
  const port = parsed.port ? parseInt(parsed.port, 10) : null;
  const hasPgbouncer = parsed.searchParams.get('pgbouncer') === 'true';
  const hasConnectionLimit = parsed.searchParams.has('connection_limit');
  const connectionLimitValue = hasConnectionLimit
    ? parseInt(parsed.searchParams.get('connection_limit') as string, 10)
    : null;
  // Log only safe, non-identifying facts — not the host, user, pass, or full URL.
  console.log(
    `[TEMP-DIAG][${caller}] db config: port=${port ?? 'none'} pgbouncer=${hasPgbouncer} ` +
    `connection_limit=${hasConnectionLimit ? connectionLimitValue : 'not set'} ` +
    `url_parseable=true`
  );
}

export async function GET(req: Request) {
  // [TEMP-DIAG] Log before session validation so output appears even when Auth.js fails.
  logDbConfigFacts('GET /api/v1/profiles/me');
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await getProfileByUserId(session.user.id);
    const completeness = calculateProfileCompleteness(profile, profile?.user?.userSkills || []);

    return NextResponse.json({ profile, completeness }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  // [TEMP-DIAG] Log before session validation so output appears even when Auth.js fails.
  logDbConfigFacts('PUT /api/v1/profiles/me');
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = profileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const updatedProfile = await updateProfile(session.user.id, parsed.data);

    return NextResponse.json({ profile: updatedProfile }, { status: 200 });
  } catch (error: any) {
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
