'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Mail, Loader2, CheckCircle2 } from 'lucide-react';

export function UnverifiedEmailBanner() {
  const { data: session } = useSession();
  const [isSending, setIsSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Only display if user is logged in, active (not pending deletion), and email is explicitly unverified
  if (!session?.user || session.user.emailVerified !== false || session.user.status === 'pending_deletion') {
    return null;
  }

  const handleResend = async () => {
    if (isSending || cooldown > 0) return;
    setIsSending(true);
    setStatusMessage(null);
    setIsSuccess(false);

    try {
      const email = session.user.email;
      if (!email) {
        throw new Error('No email found in session.');
      }

      const res = await fetch('/api/v1/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to resend verification email');
      }

      setIsSuccess(true);
      setStatusMessage('Verification link sent! Check your inbox or terminal.');
      setCooldown(60); // 60-second rate-limit cooldown
    } catch (err: any) {
      setIsSuccess(false);
      setStatusMessage(err.message || 'Failed to send email. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      role="alert"
      className="bg-amber-500/10 border-b border-amber-500/30 text-amber-600 dark:text-amber-400 px-4 py-2.5 sm:px-6 transition-all duration-200"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2 text-center sm:text-left">
          <Mail className="w-4 h-4 flex-shrink-0" />
          <span>
            <strong>Email Unverified:</strong> Please verify your email address to unlock project publishing and collaboration applications.
          </span>
        </div>

        <div className="flex items-center gap-3">
          {statusMessage && (
            <span
              className={`text-xs font-medium flex items-center gap-1 ${
                isSuccess ? 'text-success' : 'text-error'
              }`}
            >
              {isSuccess && <CheckCircle2 className="w-3.5 h-3.5" />}
              {statusMessage}
            </span>
          )}

          <button
            onClick={handleResend}
            disabled={isSending || cooldown > 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white font-medium text-xs shadow-sm transition-all disabled:opacity-50 disabled:active:scale-100 min-h-[32px]"
          >
            {isSending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Sending...
              </>
            ) : cooldown > 0 ? (
              `Resend in ${cooldown}s`
            ) : (
              'Resend Verification Email'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
