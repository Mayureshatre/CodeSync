import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/lib/auth';
import { prisma } from '@/src/server/db';
import { DomainError } from '@/src/server/errors';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get recommendations for the user
    const recommendations = await prisma.recommendation.findMany({
      where: { userId: session.user.id },
      orderBy: { surfacedAt: 'desc' }
    });

    const projectIds = recommendations.filter(r => r.targetType === 'project').map(r => r.targetId);

    // Get the projects and matches
    const projects = await prisma.project.findMany({
      where: { id: { in: projectIds }, status: 'open' },
      include: {
        owner: { select: { profile: true } },
        projectSkills: { include: { skill: true } }
      }
    });

    const matches = await prisma.match.findMany({
      where: { userId: session.user.id, projectId: { in: projectIds } }
    });

    const results = projects.map(p => {
      const match = matches.find(m => m.projectId === p.id);
      return {
        project: p,
        match: match || null
      };
    });

    // Sort by match score then recency
    results.sort((a, b) => {
      const scoreA = a.match?.score || 0;
      const scoreB = b.match?.score || 0;
      if (scoreA !== scoreB) return scoreB - scoreA;
      return new Date(b.project.publishedAt || b.project.createdAt).getTime() - new Date(a.project.publishedAt || a.project.createdAt).getTime();
    });

    return NextResponse.json({ recommendations: results }, { status: 200 });
  } catch (error: any) {
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
