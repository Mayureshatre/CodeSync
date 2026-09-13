const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'apps/web/app/api/v1/projects/[id]/complete');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const content = `import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '../../../../../../../src/lib/auth';
import { completeProject } from '../../../../../../../src/server/services/projectService';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const project = await completeProject(session.user.id, params.id);
    return NextResponse.json({ data: project });
  } catch (error: any) {
    if (error.name === 'NotFoundError') return NextResponse.json({ error: error.message }, { status: 404 });
    if (error.name === 'ForbiddenError') return NextResponse.json({ error: error.message }, { status: 403 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
`;
fs.writeFileSync(path.join(dir, 'route.ts'), content);
console.log('Complete endpoint added.');
