'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signupSchema } from '../../lib/validations/auth';
import { z } from 'zod';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

type FormData = z.infer<typeof signupSchema>;

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: FormData) => {
    setError(null);
    try {
      const res = await fetch('/api/v1/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Failed to sign up');
      }

      router.push('/auth/login?registered=true');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-[#181c24] p-8 rounded-[12px] shadow-[0_2px_8px_rgba(0,0,0,0.45),0_0_0_1px_#263042]">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Create an Account</h1>
          <p className="text-[#94a3b8] text-sm">Join CodeSync and find your missing piece</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-500 text-sm rounded-[8px]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#f1f5f9] mb-1">Email</label>
            <input
              {...register('email')}
              type="email"
              placeholder="you@example.com"
              className="w-full bg-[#141822] border border-[#263042] rounded-[8px] px-3 py-2 text-[14px] text-white placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#06b6d4]/20 focus:border-[#06b6d4] transition-all"
            />
            {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#f1f5f9] mb-1">Password</label>
            <input
              {...register('password')}
              type="password"
              placeholder="••••••••"
              className="w-full bg-[#141822] border border-[#263042] rounded-[8px] px-3 py-2 text-[14px] text-white placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#06b6d4]/20 focus:border-[#06b6d4] transition-all"
            />
            {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#06b6d4] hover:bg-[#0891b2] active:bg-[#0e7490] text-[#0a0e16] font-bold py-2 px-4 rounded-[8px] min-h-[44px] flex items-center justify-center transition-colors disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : 'Sign Up'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#94a3b8]">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-[#06b6d4] hover:text-[#0891b2]">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
