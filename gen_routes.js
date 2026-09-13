const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'apps/web/app/api/v1/projects/[id]');

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

// 1. /workspace/route.ts
const workspaceContent = `import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '../../../../../../../src/lib/auth';
import { getWorkspaceSummary } from '../../../../../../../src/server/services/workspaceService';
import { z } from 'zod';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const summary = await getWorkspaceSummary(params.id, session.user.id);
    return NextResponse.json({ data: summary });
  } catch (error: any) {
    if (error.name === 'NotFoundError') return NextResponse.json({ error: error.message }, { status: 404 });
    if (error.name === 'ForbiddenError') return NextResponse.json({ error: error.message }, { status: 403 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
`;

// 2. /workspace/tasks/route.ts
const tasksContent = `import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '../../../../../../../../src/lib/auth';
import { createTask } from '../../../../../../../../src/server/services/workspaceService';
import { z } from 'zod';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const task = await createTask(params.id, session.user.id, body);
    return NextResponse.json({ data: task });
  } catch (error: any) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 });
    if (error.name === 'NotFoundError') return NextResponse.json({ error: error.message }, { status: 404 });
    if (error.name === 'ForbiddenError') return NextResponse.json({ error: error.message }, { status: 403 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
`;

// 3. /workspace/tasks/[taskId]/route.ts
const taskItemContent = `import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '../../../../../../../../../src/lib/auth';
import { updateTask, deleteTask } from '../../../../../../../../../src/server/services/workspaceService';
import { z } from 'zod';

export async function PUT(req: NextRequest, { params }: { params: { id: string, taskId: string } }) {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const task = await updateTask(params.id, session.user.id, params.taskId, body);
    return NextResponse.json({ data: task });
  } catch (error: any) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 });
    if (error.name === 'NotFoundError') return NextResponse.json({ error: error.message }, { status: 404 });
    if (error.name === 'ForbiddenError') return NextResponse.json({ error: error.message }, { status: 403 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string, taskId: string } }) {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await deleteTask(params.id, session.user.id, params.taskId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.name === 'NotFoundError') return NextResponse.json({ error: error.message }, { status: 404 });
    if (error.name === 'ForbiddenError') return NextResponse.json({ error: error.message }, { status: 403 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
`;

// 4. /workspace/milestones/route.ts
const milestonesContent = `import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '../../../../../../../../src/lib/auth';
import { createMilestone } from '../../../../../../../../src/server/services/workspaceService';
import { z } from 'zod';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const milestone = await createMilestone(params.id, session.user.id, body);
    return NextResponse.json({ data: milestone });
  } catch (error: any) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 });
    if (error.name === 'NotFoundError') return NextResponse.json({ error: error.message }, { status: 404 });
    if (error.name === 'ForbiddenError') return NextResponse.json({ error: error.message }, { status: 403 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
`;

// 5. /workspace/milestones/[milestoneId]/route.ts
const milestoneItemContent = `import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '../../../../../../../../../src/lib/auth';
import { updateMilestone, deleteMilestone } from '../../../../../../../../../src/server/services/workspaceService';
import { z } from 'zod';

export async function PUT(req: NextRequest, { params }: { params: { id: string, milestoneId: string } }) {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const milestone = await updateMilestone(params.id, session.user.id, params.milestoneId, body);
    return NextResponse.json({ data: milestone });
  } catch (error: any) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 });
    if (error.name === 'NotFoundError') return NextResponse.json({ error: error.message }, { status: 404 });
    if (error.name === 'ForbiddenError') return NextResponse.json({ error: error.message }, { status: 403 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string, milestoneId: string } }) {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await deleteMilestone(params.id, session.user.id, params.milestoneId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.name === 'NotFoundError') return NextResponse.json({ error: error.message }, { status: 404 });
    if (error.name === 'ForbiddenError') return NextResponse.json({ error: error.message }, { status: 403 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
`;

// 6. /workspace/links/route.ts
const linksContent = `import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '../../../../../../../../src/lib/auth';
import { createProjectLink } from '../../../../../../../../src/server/services/workspaceService';
import { z } from 'zod';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const link = await createProjectLink(params.id, session.user.id, body);
    return NextResponse.json({ data: link });
  } catch (error: any) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 });
    if (error.name === 'NotFoundError') return NextResponse.json({ error: error.message }, { status: 404 });
    if (error.name === 'ForbiddenError') return NextResponse.json({ error: error.message }, { status: 403 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
`;

// 7. /workspace/links/[linkId]/route.ts
const linkItemContent = `import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '../../../../../../../../../src/lib/auth';
import { deleteProjectLink } from '../../../../../../../../../src/server/services/workspaceService';

export async function DELETE(req: NextRequest, { params }: { params: { id: string, linkId: string } }) {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await deleteProjectLink(params.id, session.user.id, params.linkId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.name === 'NotFoundError') return NextResponse.json({ error: error.message }, { status: 404 });
    if (error.name === 'ForbiddenError') return NextResponse.json({ error: error.message }, { status: 403 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
`;

// 8. /workspace/activity/route.ts
const activityContent = `import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '../../../../../../../../src/lib/auth';
import { getActivityEvents } from '../../../../../../../../src/server/services/workspaceService';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const cursor = url.searchParams.get('cursor') || undefined;

    const result = await getActivityEvents(params.id, session.user.id, limit, cursor);
    return NextResponse.json({ data: result.items, nextCursor: result.nextCursor });
  } catch (error: any) {
    if (error.name === 'NotFoundError') return NextResponse.json({ error: error.message }, { status: 404 });
    if (error.name === 'ForbiddenError') return NextResponse.json({ error: error.message }, { status: 403 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
`;

// 9. /reviews/route.ts
const reviewsContent = `import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '../../../../../../../src/lib/auth';
import { submitReview, getReviewsForProject } from '../../../../../../../src/server/services/reviewService';
import { z } from 'zod';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const reviews = await getReviewsForProject(params.id);
    return NextResponse.json({ data: reviews });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const review = await submitReview(params.id, session.user.id, body);
    return NextResponse.json({ data: review });
  } catch (error: any) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 });
    if (error.name === 'NotFoundError') return NextResponse.json({ error: error.message }, { status: 404 });
    if (error.name === 'ForbiddenError') return NextResponse.json({ error: error.message }, { status: 403 });
    if (error.name === 'ConflictError') return NextResponse.json({ error: error.message }, { status: 409 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
`;

const routes = [
  { p: 'workspace', content: workspaceContent },
  { p: 'workspace/tasks', content: tasksContent },
  { p: 'workspace/tasks/[taskId]', content: taskItemContent },
  { p: 'workspace/milestones', content: milestonesContent },
  { p: 'workspace/milestones/[milestoneId]', content: milestoneItemContent },
  { p: 'workspace/links', content: linksContent },
  { p: 'workspace/links/[linkId]', content: linkItemContent },
  { p: 'workspace/activity', content: activityContent },
  { p: 'reviews', content: reviewsContent },
];

for (const route of routes) {
  const dir = path.join(basePath, route.p);
  ensureDir(dir);
  fs.writeFileSync(path.join(dir, 'route.ts'), route.content);
}

// 10. /profiles/[username]/reviews/route.ts
const profilesBasePath = path.join(__dirname, 'apps/web/app/api/v1/profiles/[username]/reviews');
ensureDir(profilesBasePath);

const profileReviewsContent = `import { NextRequest, NextResponse } from 'next/server';
import { getProfileByUsername } from '../../../../../../../../src/server/services/profileService';
import { getReviewsForUser } from '../../../../../../../../src/server/services/reviewService';

export async function GET(req: NextRequest, { params }: { params: { username: string } }) {
  try {
    const profile = await getProfileByUsername(params.username);
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    const reviews = await getReviewsForUser(profile.userId);
    return NextResponse.json({ data: reviews });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
`;
fs.writeFileSync(path.join(profilesBasePath, 'route.ts'), profileReviewsContent);

console.log('Routes generated successfully.');
