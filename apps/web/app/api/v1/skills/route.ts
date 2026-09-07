import { NextResponse } from 'next/server';
import { searchSkills } from '@/src/server/services/skillService';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';

    const skills = await searchSkills(query);

    return NextResponse.json({ skills }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
