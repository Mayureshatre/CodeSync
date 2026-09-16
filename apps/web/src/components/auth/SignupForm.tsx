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
      <div className="bg-surface p-8 sm:p-10 rounded-2xl border border-border shadow-elevation-overlay">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-primary mb-2">Create an Account</h1>
          <p className="text-secondary text-sm">Join CodeSync and find your missing piece</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-error/10 border border-error/20 text-error text-sm rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-primary mb-1.5">Email</label>
            <input
              {...register('email')}
              type="email"
              placeholder="you@example.com"
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200"
            />
            {errors.email && <p className="mt-1.5 text-sm text-error">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-1.5">Password</label>
            <input
              {...register('password')}
              type="password"
              placeholder="••••••••"
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200"
            />
            {errors.password && <p className="mt-1.5 text-sm text-error">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-accent hover:opacity-90 active:scale-[0.98] text-white font-medium py-2.5 px-4 rounded-xl min-h-[44px] flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:active:scale-100 shadow-elevation-low"
          >
            {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : 'Sign Up'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-secondary">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-medium text-primary hover:text-accent transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
