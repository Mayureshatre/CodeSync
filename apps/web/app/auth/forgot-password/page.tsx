'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, ForgotPasswordInput } from '@/src/lib/validations/auth';
import { Loader2, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setServerError(null);
    try {
      const res = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to request password reset');
      }

      setIsSuccess(true);
    } catch (err: any) {
      setServerError(err.message || 'Something went wrong. Please try again.');
    }
  };

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

          <h1 className="text-2xl font-bold tracking-tight text-primary mb-2">Reset Password</h1>
          <p className="text-secondary text-sm">
            Enter the email address associated with your account, and we will send you a link to reset your password.
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
            <h2 className="text-lg font-bold text-primary">Check Your Email</h2>
            <p className="text-sm text-secondary leading-relaxed">
              If an account with that email exists, we have sent instructions to reset your password. The link will expire in 1 hour.
            </p>
            <div className="pt-4">
              <Link
                href="/auth/login"
                className="inline-block px-5 py-2.5 bg-surface hover:bg-surface-elevated border border-border text-primary rounded-xl text-sm font-medium transition-colors"
              >
                Return to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-primary mb-1.5">
                Email Address
              </label>
              <input
                {...register('email')}
                id="email"
                type="email"
                required
                autoFocus
                placeholder="you@example.com"
                aria-invalid={errors.email ? 'true' : 'false'}
                aria-describedby={errors.email ? 'email-error' : undefined}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200"
              />
              {errors.email && (
                <p id="email-error" className="mt-1.5 text-sm text-error">
                  {errors.email.message}
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
                  Sending link...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
