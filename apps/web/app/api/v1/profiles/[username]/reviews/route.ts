import { NextRequest, NextResponse } from 'next/server';
import { getProfileByUsername } from '../../../../../../src/server/services/profileService';
import { getReviewsForUser } from '../../../../../../src/server/services/reviewService';

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
