import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/lib/auth';
import { getProfileByUserId } from '@/src/server/services/profileService';
import { ProfileView } from '@/src/components/profile/ProfileView';

export default async function MyProfilePage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  const profile = await getProfileByUserId(session.user.id);

  if (!profile) {
    redirect('/profile/edit');
  }

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <ProfileView profile={profile} isOwner={true} />
    </div>
  );
}
