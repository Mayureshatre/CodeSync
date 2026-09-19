import { ProfileForm } from '@/src/components/profile/ProfileForm';

export default function OnboardingPage() {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-primary mb-2">Welcome to CodeSync</h1>
        <p className="text-secondary text-lg">Complete your developer profile to find your missing piece and get personalized project recommendations.</p>
      </div>
      <ProfileForm />
    </div>
  );
}
