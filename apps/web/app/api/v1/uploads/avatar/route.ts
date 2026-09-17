import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/lib/auth';
import { generatePresignedAvatarUploadUrl } from '@/src/server/services/storageService';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { mimeType, contentLength } = await req.json();

    if (!mimeType || typeof contentLength !== 'number') {
      return NextResponse.json({ error: 'Missing mimeType or contentLength' }, { status: 400 });
    }

    const result = await generatePresignedAvatarUploadUrl(session.user.id, mimeType, contentLength);
    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message.includes('Invalid file type') || error.message.includes('File size exceeds')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Avatar presign error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
