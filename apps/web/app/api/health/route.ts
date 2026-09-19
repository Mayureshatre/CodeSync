import { NextResponse } from 'next/server';
import { prisma } from '@codesync/core/db';
import { getMatchingQueue } from '@codesync/core/queue';

export const dynamic = 'force-dynamic';

export async function GET() {
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
