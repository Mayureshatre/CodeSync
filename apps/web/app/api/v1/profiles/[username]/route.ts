import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/lib/auth';
import { getProfileByUsername, calculateProfileCompleteness } from '@/src/server/services/profileService';
import { DomainError } from '@/src/server/errors';

export async function GET(req: Request, { params }: { params: { username: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const actorId = session?.user?.id;

    const profile = await getProfileByUsername(params.username, actorId);
    
    // Strip private info if not owner
    let responseProfile = profile;
    if (profile.userId !== actorId) {
      responseProfile = {
        ...profile,
        user: { id: profile.userId, userSkills: profile.user?.userSkills } as any
      } as any;
    }

    const completeness = calculateProfileCompleteness(profile, profile?.user?.userSkills || []);

    return NextResponse.json({ profile: responseProfile, completeness }, { status: 200 });
  } catch (error: any) {
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
