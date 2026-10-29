import { NextResponse } from 'next/server';
import { prisma } from '@codesync/core/db';
import { getMatchingQueue } from '@codesync/core/queue';

export const dynamic = 'force-dynamic';

// [TEMP-DIAG][HEALTH] Logs safe Prisma connection-string facts to Vercel logs.
// Never logs the URL, hostname, username, password, or query string.
function logDbConfigFacts(): void {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    console.log('[TEMP-DIAG][HEALTH] DATABASE_URL is not set in this runtime.');
    return;
  }
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    console.log('[TEMP-DIAG][HEALTH] DATABASE_URL is set but failed URL parsing — likely malformed.');
    return;
  }
  const port = parsed.port ? parseInt(parsed.port, 10) : null;
  const hasPgbouncer = parsed.searchParams.get('pgbouncer') === 'true';
  const hasConnectionLimit = parsed.searchParams.has('connection_limit');
  const connectionLimitValue = hasConnectionLimit
    ? parseInt(parsed.searchParams.get('connection_limit') as string, 10)
    : null;
  console.log(
    `[TEMP-DIAG][HEALTH] db config: port=${port ?? 'none'} pgbouncer=${hasPgbouncer} ` +
    `connection_limit=${hasConnectionLimit ? connectionLimitValue : 'not set'} ` +
    `url_parseable=true`
  );
}

export async function GET() {
  logDbConfigFacts();

  let dbStatus = 'ok';
  let redisStatus = 'ok';

  // 1. Check PostgreSQL
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    dbStatus = 'error';
  }

  // 2. Check Redis using the existing queue boundary
  try {
    const queue = getMatchingQueue();
    // In BullMQ v6, the raw client is exposed through the datastore backend
    const client = await queue.backend.connection.client;
    await client.info();
  } catch (error) {
    redisStatus = 'error';
  }

  const isHealthy = dbStatus === 'ok' && redisStatus === 'ok';
  const statusCode = isHealthy ? 200 : 503;

  return NextResponse.json(
    {
      status: isHealthy ? 'ok' : 'error',
      database: dbStatus,
      redis: redisStatus
    },
    { status: statusCode }
  );
}
