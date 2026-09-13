const fs = require('fs');
const path = require('path');

const base = path.join(__dirname, 'apps/web/app/api/v1/admin');

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

ensureDir(path.join(base, 'reports'));
ensureDir(path.join(base, 'reports/[id]/resolve'));
ensureDir(path.join(base, 'users/[id]/suspend'));
ensureDir(path.join(base, 'projects/[id]/moderate'));
ensureDir(path.join(base, 'skills'));
ensureDir(path.join(base, 'skills/[id]/resolve'));
ensureDir(path.join(base, 'config'));

// 1. GET /admin/reports
fs.writeFileSync(path.join(base, 'reports', 'route.ts'), `
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '../../../../../../src/lib/auth';
import { getReports } from '../../../../../../src/server/services/adminService';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const cursor = url.searchParams.get('cursor') || undefined;

    const reports = await getReports({ id: session.user.id, role: session.user.role as string }, limit, cursor);
    return NextResponse.json({ data: reports });
  } catch (error: any) {
    if (error.name === 'ForbiddenError') return NextResponse.json({ error: error.message }, { status: 403 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
`);

// 2. POST /admin/reports/[id]/resolve
fs.writeFileSync(path.join(base, 'reports/[id]/resolve', 'route.ts'), `
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '../../../../../../../src/lib/auth';
import { resolveReport } from '../../../../../../../src/server/services/adminService';
import { resolveReportSchema } from '../../../../../../../src/lib/validations/admin';
import { z } from 'zod';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = resolveReportSchema.parse(body);

    const report = await resolveReport({ id: session.user.id, role: session.user.role as string }, params.id, parsed.status, parsed.resolutionNotes);
    return NextResponse.json({ data: report });
  } catch (error: any) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues }, { status: 400 });
    if (error.name === 'ForbiddenError') return NextResponse.json({ error: error.message }, { status: 403 });
    if (error.name === 'NotFoundError') return NextResponse.json({ error: error.message }, { status: 404 });
    if (error.name === 'ConflictError') return NextResponse.json({ error: error.message }, { status: 409 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
`);

// 3. POST /admin/users/[id]/suspend
fs.writeFileSync(path.join(base, 'users/[id]/suspend', 'route.ts'), `
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '../../../../../../../src/lib/auth';
import { suspendUser } from '../../../../../../../src/server/services/adminService';
import { suspendUserSchema } from '../../../../../../../src/lib/validations/admin';
import { z } from 'zod';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = suspendUserSchema.parse(body);

    const user = await suspendUser({ id: session.user.id, role: session.user.role as string }, params.id, parsed.reason);
    return NextResponse.json({ data: user });
  } catch (error: any) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues }, { status: 400 });
    if (error.name === 'ForbiddenError') return NextResponse.json({ error: error.message }, { status: 403 });
    if (error.name === 'NotFoundError') return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
`);

// 4. POST /admin/projects/[id]/moderate
fs.writeFileSync(path.join(base, 'projects/[id]/moderate', 'route.ts'), `
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '../../../../../../../src/lib/auth';
import { toggleProjectModeration } from '../../../../../../../src/server/services/adminService';
import { moderateProjectSchema } from '../../../../../../../src/lib/validations/admin';
import { z } from 'zod';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = moderateProjectSchema.parse(body);

    const project = await toggleProjectModeration({ id: session.user.id, role: session.user.role as string }, params.id, parsed.hidden, parsed.reason);
    return NextResponse.json({ data: project });
  } catch (error: any) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues }, { status: 400 });
    if (error.name === 'ForbiddenError') return NextResponse.json({ error: error.message }, { status: 403 });
    if (error.name === 'NotFoundError') return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
`);

// 5. GET /admin/skills
fs.writeFileSync(path.join(base, 'skills', 'route.ts'), `
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '../../../../../../src/lib/auth';
import { getPendingSkills } from '../../../../../../src/server/services/adminService';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const skills = await getPendingSkills({ id: session.user.id, role: session.user.role as string });
    return NextResponse.json({ data: skills });
  } catch (error: any) {
    if (error.name === 'ForbiddenError') return NextResponse.json({ error: error.message }, { status: 403 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
`);

// 6. POST /admin/skills/[id]/resolve
fs.writeFileSync(path.join(base, 'skills/[id]/resolve', 'route.ts'), `
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '../../../../../../../src/lib/auth';
import { resolvePendingSkill } from '../../../../../../../src/server/services/adminService';
import { resolveSkillSchema } from '../../../../../../../src/lib/validations/admin';
import { z } from 'zod';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = resolveSkillSchema.parse(body);

    const result = await resolvePendingSkill({ id: session.user.id, role: session.user.role as string }, params.id, parsed.action, parsed.targetSkillId);
    return NextResponse.json({ data: result });
  } catch (error: any) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues }, { status: 400 });
    if (error.name === 'ForbiddenError') return NextResponse.json({ error: error.message }, { status: 403 });
    if (error.name === 'NotFoundError') return NextResponse.json({ error: error.message }, { status: 404 });
    if (error.name === 'ConflictError') return NextResponse.json({ error: error.message }, { status: 409 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
`);

// 7. PUT /admin/config
fs.writeFileSync(path.join(base, 'config', 'route.ts'), `
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '../../../../../../src/lib/auth';
import { updatePlatformConfig } from '../../../../../../src/server/services/adminService';

export async function PUT(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    if (!body.key || body.value === undefined) {
      return NextResponse.json({ error: 'Key and value required' }, { status: 400 });
    }

    const config = await updatePlatformConfig({ id: session.user.id, role: session.user.role as string }, body.key, String(body.value));
    return NextResponse.json({ data: config });
  } catch (error: any) {
    if (error.name === 'ForbiddenError') return NextResponse.json({ error: error.message }, { status: 403 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
`);

console.log('Admin API routes created');
