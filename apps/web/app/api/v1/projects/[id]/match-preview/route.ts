import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/lib/auth';
import { prisma } from '@/src/server/db';
import { computeMatchScore } from '@codesync/core/matchingService';
import { DomainError, ForbiddenError, NotFoundError } from '@/src/server/errors';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = params.id;
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        projectSkills: { include: { skill: true } },
        projectRoles: {
          include: {
            projectRoleSkills: { include: { skill: true } }
          }
        }
      }
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Only the project owner can preview matches for their draft or open project
    if (project.ownerId !== session.user.id) {
      throw new ForbiddenError('Only the project owner can preview candidate matches');
    }

    // Fetch active candidates who have a public profile and are open to collaboration
    const candidates = await prisma.user.findMany({
      where: {
        id: { not: session.user.id },
        status: { notIn: ['suspended', 'deleted'] },
        profile: {
          profileVisibility: 'public',
          availability: { not: 'not_looking' }
        }
      },
      include: {
        profile: true,
        userSkills: { include: { skill: true } }
      },
      take: 50
    });

    const matches = [];

    for (const candidate of candidates) {
      if (!candidate.profile) continue;

      const result = computeMatchScore(candidate, project);
      if (result && result.score > 0) {
        matches.push({
          userId: candidate.id,
          username: candidate.profile.username,
          displayName: candidate.profile.displayName,
          avatarUrl: candidate.profile.avatarUrl,
          experienceLevel: candidate.profile.experienceLevel,
          availability: candidate.profile.availability,
          score: result.score,
          factorBreakdown: result.factorBreakdown,
          explanation: result.explanation
        });
      }
    }

    // Sort descending by score
    matches.sort((a, b) => b.score - a.score);

    return NextResponse.json({
      projectId,
      totalMatched: matches.length,
      previews: matches.slice(0, 10)
    });
  } catch (error: any) {
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
