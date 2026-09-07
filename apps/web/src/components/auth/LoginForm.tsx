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
      <div className="bg-[#181c24] p-8 rounded-[12px] shadow-[0_2px_8px_rgba(0,0,0,0.45),0_0_0_1px_#263042]">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-[#94a3b8] text-sm">Sign in to continue to CodeSync</p>
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
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-[#f1f5f9]">Password</label>
              <Link href="/auth/forgot-password" className="text-sm text-[#06b6d4] hover:text-[#0891b2]">
                Forgot password?
              </Link>
            </div>
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
            {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : 'Sign In'}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#263042]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#181c24] text-[#64748b]">Or continue with</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              onClick={() => signIn('github')}
              className="w-full bg-transparent border border-[#263042] text-[#f1f5f9] hover:bg-[#1e2433] hover:border-[#334155] font-medium py-2 px-4 rounded-[8px] min-h-[44px] transition-colors"
            >
              GitHub
            </button>
            <button
              onClick={() => signIn('google')}
              className="w-full bg-transparent border border-[#263042] text-[#f1f5f9] hover:bg-[#1e2433] hover:border-[#334155] font-medium py-2 px-4 rounded-[8px] min-h-[44px] transition-colors"
            >
              Google
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-[#94a3b8]">
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="text-[#06b6d4] hover:text-[#0891b2]">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
