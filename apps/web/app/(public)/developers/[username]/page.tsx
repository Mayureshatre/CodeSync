import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/lib/auth';
import { getProfileByUsername } from '@/src/server/services/profileService';
import { ProfileView } from '@/src/components/profile/ProfileView';

export default async function PublicProfilePage({ params }: { params: { username: string } }) {
  const session = await getServerSession(authOptions);
  const actorId = session?.user?.id;

  try {
    const profile = await getProfileByUsername(params.username, actorId);
    
    // Strip private info if not owner
    let responseProfile = profile;
    if (profile.userId !== actorId) {
      responseProfile = {
        ...profile,
        user: { id: profile.userId, userSkills: profile.user?.userSkills } as any
      } as any;
    }

    const isOwner = actorId === profile.userId;

    return (
      <div className="py-10 px-4 sm:px-6 lg:px-8 bg-[#0B0D10] min-h-screen">
        <ProfileView profile={responseProfile} isOwner={isOwner} />
      </div>
    );
  } catch (error) {
    notFound();
  }
}
