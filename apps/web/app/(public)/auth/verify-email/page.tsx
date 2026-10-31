'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2, Send } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const hasAttempted = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Verification token is missing.');
      return;
    }

    if (hasAttempted.current) return;
    hasAttempted.current = true;

    fetch('/api/v1/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    })
      .then(async (res) => {
        if (res.ok) {
          setStatus('success');
        } else {
          const data = await res.json().catch(() => ({}));
          setStatus('error');
          setErrorMessage(data.error || 'Failed to verify email. The token may be invalid or expired.');
        }
      })
      .catch(() => {
        setStatus('error');
        setErrorMessage('An unexpected network error occurred.');
      });
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail) return;

    setIsResending(true);
    setResendStatus(null);

    try {
      const res = await fetch('/api/v1/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to send verification email.');
      }

      setResendStatus('If that email is registered and unverified, a fresh link has been sent!');
    } catch (err: any) {
      setResendStatus(err.message || 'Failed to request new link.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex flex-col items-center p-8">
      {status === 'loading' && (
        <div className="flex flex-col items-center gap-4 animate-in fade-in">
          <Loader2 className="h-12 w-12 text-accent animate-spin" />
          <p className="text-muted-foreground">Please wait while we verify your token...</p>
        </div>
      )}

      {status === 'success' && (
        <div className="flex flex-col items-center gap-4 animate-in zoom-in duration-300">
          <CheckCircle className="h-16 w-16 text-success" />
          <p className="text-lg font-medium text-center">Your email has been successfully verified!</p>
          <p className="text-sm text-secondary text-center">
            You can now publish projects and apply to collaborate with other developers.
          </p>
          <Link 
            href="/auth/login" 
            className="mt-4 px-6 py-2 bg-accent text-accent-foreground rounded-full font-medium hover:bg-accent/90 transition-colors shadow-elevation-low"
          >
            Continue to Login
          </Link>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center gap-4 animate-in zoom-in duration-300 w-full max-w-sm">
          <XCircle className="h-16 w-16 text-destructive" />
          <p className="text-lg font-medium text-center">Verification Failed</p>
          <p className="text-muted-foreground text-center text-sm">{errorMessage}</p>

          {/* Inline Recovery Form for Expired / Invalid Tokens */}
          <div className="w-full mt-4 p-4 border border-border rounded-xl bg-background/50">
            <p className="text-xs font-medium text-secondary mb-2">Request a new verification link:</p>
            <form onSubmit={handleResend} className="flex flex-col gap-2">
              <input
                type="email"
                placeholder="Enter your registered email"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <button
                type="submit"
                disabled={isResending}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-accent text-white text-xs font-medium rounded-lg hover:bg-accent/90 disabled:opacity-50 transition-colors"
              >
                {isResending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Send New Verification Link
                  </>
                )}
              </button>
            </form>
            {resendStatus && (
              <p className="mt-2 text-xs text-center text-secondary">{resendStatus}</p>
            )}
          </div>

          <Link 
            href="/auth/login" 
            className="mt-2 px-6 py-2 border border-border bg-surface hover:bg-background rounded-full font-medium text-sm transition-colors"
          >
            Return to Login
          </Link>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface shadow-elevation-card rounded-xl border border-border overflow-hidden">
        <div className="text-center border-b border-border/50 p-6 bg-muted/20">
          <h1 className="text-2xl font-bold font-display">Email Verification</h1>
          <p className="text-muted-foreground mt-1">Verifying your account email address.</p>
        </div>
        <Suspense fallback={
          <div className="flex flex-col items-center p-8 gap-4">
            <Loader2 className="h-12 w-12 text-accent animate-spin" />
            <p className="text-muted-foreground">Loading verification...</p>
          </div>
        }>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
