'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordFormSchema, ResetPasswordFormInput } from '@/src/lib/validations/auth';
import { Loader2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormInput>({
    resolver: zodResolver(resetPasswordFormSchema),
  });

  const onSubmit = async (data: ResetPasswordFormInput) => {
    setServerError(null);

    if (!token) {
      setServerError('Missing reset token. Please request a new password reset link.');
      return;
    }

    try {
      const res = await fetch('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to reset password');
      }

      setIsSuccess(true);
    } catch (err: any) {
      setServerError(err.message || 'Something went wrong. Please try again.');
    }
  };

  if (!token) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-surface p-8 sm:p-10 rounded-2xl border border-border shadow-elevation-overlay text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-error/10 text-error border border-error/20 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-primary">Invalid Reset Link</h1>
          <p className="text-secondary text-sm">
            This password reset link is invalid or incomplete. Please request a new one.
          </p>
          <div className="pt-2">
            <Link
              href="/auth/forgot-password"
              className="inline-block px-5 py-2.5 bg-accent text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Request New Link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-surface p-8 sm:p-10 rounded-2xl border border-border shadow-elevation-overlay">
        <div className="mb-6">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-secondary hover:text-primary transition-colors mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Sign In
          </Link>

          <h1 className="text-2xl font-bold tracking-tight text-primary mb-2">Create New Password</h1>
          <p className="text-secondary text-sm">
            Please enter and confirm your new password below.
          </p>
        </div>

        {serverError && (
          <div className="mb-6 p-4 bg-error/10 border border-error/20 text-error text-sm rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        {isSuccess ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-success/10 text-success border border-success/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-primary">Password Reset Successful</h2>
            <p className="text-sm text-secondary leading-relaxed">
              Your password has been securely updated. All previous sessions have been invalidated.
            </p>
            <div className="pt-4">
              <Link
                href="/auth/login"
                className="inline-block px-5 py-2.5 bg-accent text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Sign In With New Password
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-primary mb-1.5">
                New Password
              </label>
              <input
                {...register('password')}
                id="password"
                type="password"
                required
                autoFocus
                placeholder="At least 8 characters"
                aria-invalid={errors.password ? 'true' : 'false'}
                aria-describedby={errors.password ? 'password-error' : undefined}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200"
              />
              {errors.password && (
                <p id="password-error" className="mt-1.5 text-sm text-error">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-primary mb-1.5">
                Confirm New Password
              </label>
              <input
                {...register('confirmPassword')}
                id="confirmPassword"
                type="password"
                required
                placeholder="Re-enter your password"
                aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                aria-describedby={errors.confirmPassword ? 'confirm-error' : undefined}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200"
              />
              {errors.confirmPassword && (
                <p id="confirm-error" className="mt-1.5 text-sm text-error">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-accent hover:opacity-90 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl text-sm shadow-elevation-low transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating password...
                </>
              ) : (
                'Update Password'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center py-24">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
