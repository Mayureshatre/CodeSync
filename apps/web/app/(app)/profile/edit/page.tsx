import { ProfileForm } from '@/src/components/profile/ProfileForm';
import { SkillManager } from '@/src/components/profile/SkillManager';

export default function EditProfilePage() {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-12">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-primary mb-2">Edit Your Profile</h1>
        <p className="text-secondary text-lg">Manage your personal information and technical skills.</p>
      </div>
      <ProfileForm />
      <SkillManager />
    </div>
  );
}
