'use client';

import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '../../lib/validations/auth';
import { z } from 'zod';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

type FormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/dashboard';
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: FormData) => {
    setError(null);
    const result = await signIn('credentials', {
      redirect: false,
      email: data.email,
      password: data.password,
    });

    if (result?.error) {
      setError('Invalid email or password');
    } else {
      router.push(from);
      router.refresh();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-surface p-8 sm:p-10 rounded-2xl border border-border shadow-elevation-overlay">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-primary mb-2">Welcome Back</h1>
          <p className="text-secondary text-sm">Sign in to continue your journey</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-error/10 border border-error/20 text-error text-sm rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-primary mb-1.5">Email</label>
            <input
              {...register('email')}
              id="email"
              type="email"
              aria-invalid={errors.email ? "true" : "false"}
              aria-describedby={errors.email ? "email-error" : undefined}
              placeholder="you@example.com"
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200"
            />
            {errors.email && <p id="email-error" className="mt-1.5 text-sm text-error">{errors.email.message}</p>}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-primary">Password</label>
              <Link href="/auth/forgot-password" className="text-sm font-medium text-accent hover:text-accent-secondary transition-colors">
                Forgot password?
              </Link>
            </div>
            <input
              {...register('password')}
              id="password"
              type="password"
              aria-invalid={errors.password ? "true" : "false"}
              aria-describedby={errors.password ? "password-error" : undefined}
              placeholder="••••••••"
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200"
            />
            {errors.password && <p id="password-error" className="mt-1.5 text-sm text-error">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-accent hover:opacity-90 active:scale-[0.98] text-white font-medium py-2.5 px-4 rounded-xl min-h-[44px] flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:active:scale-100 shadow-elevation-low"
          >
            {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : 'Sign In'}
          </button>
        </form>

        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-surface text-secondary">Or continue with</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <button
              onClick={() => signIn('github')}
              className="w-full bg-background border border-border text-primary hover:bg-surface-elevated hover:shadow-elevation-low font-medium py-2.5 px-4 rounded-xl min-h-[44px] transition-all duration-200"
            >
              GitHub
            </button>
            <button
              onClick={() => signIn('google')}
              className="w-full bg-background border border-border text-primary hover:bg-surface-elevated hover:shadow-elevation-low font-medium py-2.5 px-4 rounded-xl min-h-[44px] transition-all duration-200"
            >
              Google
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-secondary">
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="font-medium text-primary hover:text-accent transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
