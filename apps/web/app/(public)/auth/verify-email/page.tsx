'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
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
          <Link 
            href="/auth/login" 
            className="mt-4 px-6 py-2 bg-accent text-accent-foreground rounded-full font-medium hover:bg-accent/90 transition-colors"
          >
            Continue to Login
          </Link>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center gap-4 animate-in zoom-in duration-300">
          <XCircle className="h-16 w-16 text-destructive" />
          <p className="text-lg font-medium text-center">Verification Failed</p>
          <p className="text-muted-foreground text-center">{errorMessage}</p>
          <Link 
            href="/auth/login" 
            className="mt-4 px-6 py-2 border border-border bg-surface hover:bg-background rounded-full font-medium transition-colors"
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
