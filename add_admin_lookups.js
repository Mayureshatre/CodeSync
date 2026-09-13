const fs = require('fs');
const path = require('path');

const adminServicePath = path.join(__dirname, 'apps/web/src/server/services/adminService.ts');
let adminService = fs.readFileSync(adminServicePath, 'utf8');

adminService += `

export async function getAdminUsers(actor: Actor, q?: string, limit = 50, cursor?: string) {
  requireModeratorOrAdmin(actor);
  const where = q ? {
    OR: [
      { email: { contains: q, mode: 'insensitive' as const } },
      { profile: { displayName: { contains: q, mode: 'insensitive' as const } } }
    ]
  } : {};
  
  const items = await prisma.user.findMany({
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    where,
    orderBy: { createdAt: 'desc' },
    select: { id: true, email: true, status: true, role: true, createdAt: true, profile: { select: { displayName: true } } }
  });
  let nextCursor: string | undefined = undefined;
  if (items.length > limit) {
    nextCursor = items.pop()!.id;
  }
  return { items, nextCursor };
}

export async function getAdminProjects(actor: Actor, q?: string, limit = 50, cursor?: string) {
  requireModeratorOrAdmin(actor);
  const where = q ? { name: { contains: q, mode: 'insensitive' as const } } : {};
  const items = await prisma.project.findMany({
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    where,
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, status: true, moderationHidden: true, createdAt: true, owner: { select: { email: true } } }
  });
  let nextCursor: string | undefined = undefined;
  if (items.length > limit) {
    nextCursor = items.pop()!.id;
  }
  return { items, nextCursor };
}

export async function getAdminConfigs(actor: Actor) {
  requireAdmin(actor);
  return prisma.platformConfig.findMany({
    orderBy: { key: 'asc' }
  });
}
`;

fs.writeFileSync(adminServicePath, adminService);

const baseApi = path.join(__dirname, 'apps/web/app/api/v1/admin');

// 1. GET config
const configRoute = path.join(baseApi, 'config', 'route.ts');
let configCode = fs.readFileSync(configRoute, 'utf8');
configCode = configCode.replace(
  `import { updatePlatformConfig } from '../../../../../src/server/services/adminService';`,
  `import { updatePlatformConfig, getAdminConfigs } from '../../../../../src/server/services/adminService';\n
export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const configs = await getAdminConfigs({ id: session.user.id, role: (session.user as any).role as string });
    return NextResponse.json({ data: configs });
  } catch (error: any) {
    if (error.name === 'ForbiddenError') return NextResponse.json({ error: error.message }, { status: 403 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}`
);
fs.writeFileSync(configRoute, configCode);

// 2. GET users
fs.writeFileSync(path.join(baseApi, 'users', 'route.ts'), `
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '../../../../../src/lib/auth';
import { getAdminUsers } from '../../../../../src/server/services/adminService';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const url = new URL(req.url);
    const q = url.searchParams.get('q') || undefined;
    const cursor = url.searchParams.get('cursor') || undefined;
    const result = await getAdminUsers({ id: session.user.id, role: (session.user as any).role as string }, q, 50, cursor);
    return NextResponse.json({ data: result });
  } catch (error: any) {
    if (error.name === 'ForbiddenError') return NextResponse.json({ error: error.message }, { status: 403 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
`);

// 3. GET projects
fs.writeFileSync(path.join(baseApi, 'projects', 'route.ts'), `
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '../../../../../src/lib/auth';
import { getAdminProjects } from '../../../../../src/server/services/adminService';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const url = new URL(req.url);
    const q = url.searchParams.get('q') || undefined;
    const cursor = url.searchParams.get('cursor') || undefined;
    const result = await getAdminProjects({ id: session.user.id, role: (session.user as any).role as string }, q, 50, cursor);
    return NextResponse.json({ data: result });
  } catch (error: any) {
    if (error.name === 'ForbiddenError') return NextResponse.json({ error: error.message }, { status: 403 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
`);
console.log('Added lookup routes');
