import { NextResponse } from 'next/server';
import { getCurrentSession } from '../../../../src/lib/auth';
import { createProject } from '../../../../src/server/services/projectService';
import { searchProjects } from '../../../../src/server/services/discoveryService';
import { projectSchema } from '../../../../src/lib/validations/project';
import { projectSearchSchema } from '../../../../src/lib/validations/discovery';
import { DomainError } from '../../../../src/server/errors';

export async function GET(req: Request) {
  try {
    const session = await getCurrentSession();
    const userId = session?.user?.id || null;

    const { searchParams } = new URL(req.url);
    const input: Record<string, any> = {};

    searchParams.forEach((value, key) => {
      if (['skills', 'category', 'duration', 'difficulty', 'availability', 'projectType'].includes(key)) {
        if (!input[key]) input[key] = [];
        input[key].push(value);
      } else {
        input[key] = value;
      }
    });

    const parsed = projectSearchSchema.safeParse(input);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const results = await searchProjects(userId, parsed.data);
    return NextResponse.json(results, { status: 200 });
  } catch (error: any) {
    console.error("GET ERROR:", error);
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = projectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const project = await createProject(session.user.id, parsed.data);
    return NextResponse.json({ project }, { status: 201 });
  } catch (error: any) {
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
