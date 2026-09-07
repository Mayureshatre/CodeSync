import { ProfileForm } from '@/src/components/profile/ProfileForm';
import { SkillManager } from '@/src/components/profile/SkillManager';

export default function EditProfilePage() {
  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 bg-[#0B0D10] min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Edit Your Profile</h1>
        <ProfileForm />
        <SkillManager />
      </div>
    </div>
  );
}
