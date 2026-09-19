'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileSchema, ProfileInput } from '../../lib/validations/profile';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export function ProfileForm() {
  const router = useRouter();
  const { update } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      profileVisibility: 'public',
      availability: 'open_to_projects',
      experienceLevel: 'intermediate',
      preferredCollaboration: [],
    }
  });

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/v1/profiles/me');
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            reset(data.profile);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [reset]);

  const onSubmit = async (data: ProfileInput) => {
    setError(null);
    try {
      const res = await fetch('/api/v1/profiles/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Failed to update profile');
      }

      await update({ hasProfile: true });
      window.location.href = '/profile';
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-accent w-8 h-8" /></div>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 w-full max-w-2xl mx-auto bg-surface p-8 sm:p-10 rounded-2xl border border-border shadow-elevation-overlay">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-primary mb-2">Developer Profile</h2>
        <p className="text-sm text-secondary">Complete your profile to find your missing piece.</p>
      </div>
      
      {error && (
        <div className="p-4 bg-error/10 border border-error/20 text-error text-sm rounded-xl">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-primary mb-1.5">Display Name</label>
          <input
            {...register('displayName')}
            id="displayName"
            aria-invalid={errors.displayName ? "true" : "false"}
            aria-describedby={errors.displayName ? "displayName-error" : undefined}
            placeholder="Jane Doe"
            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200"
          />
          {errors.displayName && <p id="displayName-error" className="mt-1.5 text-sm text-error">{errors.displayName.message}</p>}
        </div>

        <div>
          <label htmlFor="username" className="block text-sm font-medium text-primary mb-1.5">Username</label>
          <input
            {...register('username')}
            id="username"
            aria-invalid={errors.username ? "true" : "false"}
            aria-describedby={errors.username ? "username-error" : undefined}
            placeholder="janedoe"
            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200"
          />
          {errors.username && <p id="username-error" className="mt-1.5 text-sm text-error">{errors.username.message}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-primary mb-1.5">Bio</label>
        <textarea
          {...register('bio')}
          id="bio"
          aria-invalid={errors.bio ? "true" : "false"}
          aria-describedby={errors.bio ? "bio-error" : undefined}
          rows={4}
          placeholder="I build things for the web..."
          className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200 resize-none"
        />
        {errors.bio && <p id="bio-error" className="mt-1.5 text-sm text-error">{errors.bio.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-primary mb-1.5">Location</label>
          <input
            {...register('location')}
            id="location"
            aria-invalid={errors.location ? "true" : "false"}
            placeholder="San Francisco, CA"
            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200"
          />
        </div>

        <div>
          <label htmlFor="availability" className="block text-sm font-medium text-primary mb-1.5">Availability</label>
          <select
            {...register('availability')}
            id="availability"
            aria-invalid={errors.availability ? "true" : "false"}
            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200"
          >
            <option value="available">Available</option>
            <option value="open_to_projects">Open to Projects</option>
            <option value="busy">Busy</option>
            <option value="not_looking">Not Looking</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="experienceLevel" className="block text-sm font-medium text-primary mb-1.5">Experience Level</label>
        <select
          {...register('experienceLevel')}
          id="experienceLevel"
          aria-invalid={errors.experienceLevel ? "true" : "false"}
          className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200"
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
          <option value="expert">Expert</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label htmlFor="githubUrl" className="block text-sm font-medium text-primary mb-1.5">GitHub URL</label>
          <input
            {...register('githubUrl')}
            id="githubUrl"
            aria-invalid={errors.githubUrl ? "true" : "false"}
            aria-describedby={errors.githubUrl ? "githubUrl-error" : undefined}
            placeholder="https://github.com/janedoe"
            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200"
          />
          {errors.githubUrl && <p id="githubUrl-error" className="mt-1.5 text-sm text-error">{errors.githubUrl.message}</p>}
        </div>
        <div>
          <label htmlFor="linkedinUrl" className="block text-sm font-medium text-primary mb-1.5">LinkedIn URL</label>
          <input
            {...register('linkedinUrl')}
            id="linkedinUrl"
            aria-invalid={errors.linkedinUrl ? "true" : "false"}
            placeholder="https://linkedin.com/in/janedoe"
            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200"
          />
        </div>
      </div>

      <div className="flex justify-end pt-6 border-t border-border">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-accent hover:opacity-90 active:scale-[0.98] text-white font-medium py-2.5 px-6 rounded-xl flex items-center transition-all duration-200 disabled:opacity-50 disabled:active:scale-100 shadow-elevation-low"
        >
          {isSubmitting ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : null}
          Save Profile
        </button>
      </div>
    </form>
  );
}
