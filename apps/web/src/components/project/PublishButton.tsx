"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2, AlertCircle, Mail } from 'lucide-react';

export function PublishButton({ projectId }: { projectId: string }) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const router = useRouter();

  const handlePublish = async () => {
    setIsLoading(true);
    setError(null);
    setResendMessage(null);

    try {
      const res = await fetch(`/api/v1/projects/${projectId}/publish`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to publish project');
      }

      setIsSuccess(true);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!session?.user?.email || isResending) return;
    setIsResending(true);
    setResendMessage(null);

    try {
      const res = await fetch('/api/v1/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session.user.email }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to send verification link.');
      }

      setResendMessage('Verification link sent! Check your inbox or console.');
    } catch (err: any) {
      setResendMessage(err.message || 'Failed to send verification link.');
    } finally {
      setIsResending(false);
    }
  };

  if (isSuccess) return null;

  const isEmailUnverifiedError = error?.toLowerCase().includes('email must be verified');

  return (
    <div className="flex flex-col gap-2 w-full sm:w-auto">
      <button 
        onClick={handlePublish}
        disabled={isLoading}
        className="flex-1 sm:flex-none px-5 py-2.5 bg-accent hover:opacity-90 active:scale-[0.98] text-white font-medium rounded-xl flex items-center justify-center transition-all duration-200 shadow-elevation-low disabled:opacity-50 disabled:active:scale-100"
      >
        {isLoading && <Loader2 className="animate-spin w-4 h-4 mr-2" />}
        Publish Project
      </button>

      {error && (
        <div className="text-xs text-error flex flex-col gap-1 p-2 rounded-lg bg-error/10 border border-error/20">
          <div className="flex items-center gap-1.5 font-medium">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{error}</span>
          </div>

          {isEmailUnverifiedError && session?.user?.email && (
            <div className="mt-1 flex flex-col gap-1">
              <button
                onClick={handleResend}
                disabled={isResending}
                className="inline-flex items-center gap-1 text-accent hover:underline font-semibold text-xs"
              >
                {isResending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Mail className="w-3 h-3" />
                )}
                Resend verification email to {session.user.email}
              </button>
              {resendMessage && (
                <span className="text-[11px] text-secondary">{resendMessage}</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
