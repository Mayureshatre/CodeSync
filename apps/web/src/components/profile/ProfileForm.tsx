'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileSchema, ProfileInput } from '../../lib/validations/profile';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function ProfileForm() {
  const router = useRouter();
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

      router.push('/profile');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-[#06b6d4]" /></div>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl mx-auto bg-[#181c24] p-8 rounded-[12px] shadow-[0_2px_8px_rgba(0,0,0,0.45),0_0_0_1px_#263042]">
      <h2 className="text-xl font-bold text-white mb-4">Basic Information</h2>
      
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-500 text-sm rounded-[8px]">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#f1f5f9] mb-1">Display Name</label>
          <input
            {...register('displayName')}
            className="w-full bg-[#141822] border border-[#263042] rounded-[8px] px-3 py-2 text-[14px] text-white placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#06b6d4]/20 focus:border-[#06b6d4]"
          />
          {errors.displayName && <p className="mt-1 text-sm text-red-500">{errors.displayName.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-[#f1f5f9] mb-1">Username</label>
          <input
            {...register('username')}
            className="w-full bg-[#141822] border border-[#263042] rounded-[8px] px-3 py-2 text-[14px] text-white placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#06b6d4]/20 focus:border-[#06b6d4]"
          />
          {errors.username && <p className="mt-1 text-sm text-red-500">{errors.username.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#f1f5f9] mb-1">Bio</label>
        <textarea
          {...register('bio')}
          rows={3}
          className="w-full bg-[#141822] border border-[#263042] rounded-[8px] px-3 py-2 text-[14px] text-white placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#06b6d4]/20 focus:border-[#06b6d4]"
        />
        {errors.bio && <p className="mt-1 text-sm text-red-500">{errors.bio.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#f1f5f9] mb-1">Location</label>
          <input
            {...register('location')}
            className="w-full bg-[#141822] border border-[#263042] rounded-[8px] px-3 py-2 text-[14px] text-white placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#06b6d4]/20 focus:border-[#06b6d4]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#f1f5f9] mb-1">Availability</label>
          <select
            {...register('availability')}
            className="w-full bg-[#141822] border border-[#263042] rounded-[8px] px-3 py-2 text-[14px] text-white focus:outline-none focus:ring-2 focus:ring-[#06b6d4]/20 focus:border-[#06b6d4]"
          >
            <option value="available">Available</option>
            <option value="open_to_projects">Open to Projects</option>
            <option value="busy">Busy</option>
            <option value="not_looking">Not Looking</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#f1f5f9] mb-1">Experience Level</label>
        <select
          {...register('experienceLevel')}
          className="w-full bg-[#141822] border border-[#263042] rounded-[8px] px-3 py-2 text-[14px] text-white focus:outline-none focus:ring-2 focus:ring-[#06b6d4]/20 focus:border-[#06b6d4]"
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
          <option value="expert">Expert</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#f1f5f9] mb-1">GitHub URL</label>
          <input
            {...register('githubUrl')}
            className="w-full bg-[#141822] border border-[#263042] rounded-[8px] px-3 py-2 text-[14px] text-white placeholder-[#64748b]"
          />
          {errors.githubUrl && <p className="mt-1 text-sm text-red-500">{errors.githubUrl.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-[#f1f5f9] mb-1">LinkedIn URL</label>
          <input
            {...register('linkedinUrl')}
            className="w-full bg-[#141822] border border-[#263042] rounded-[8px] px-3 py-2 text-[14px] text-white placeholder-[#64748b]"
          />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-[#06b6d4] hover:bg-[#0891b2] text-[#0a0e16] font-bold py-2 px-6 rounded-[8px] flex items-center transition-colors disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : null}
          Save Profile
        </button>
      </div>
    </form>
  );
}
