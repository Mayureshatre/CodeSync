'use client';
import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full bg-surface border border-border rounded-2xl shadow-elevation-flat p-8 text-center flex flex-col items-center">
            <h2 className="text-2xl font-bold text-primary tracking-tight mb-2">Something went wrong</h2>
            <p className="text-secondary mb-6">We&apos;ve been notified and are looking into it.</p>
            {error.digest && <p className="text-xs text-muted font-mono mb-6 bg-surface-elevated px-3 py-1.5 rounded-lg border border-border">Error ID: {error.digest}</p>}
            <button
              onClick={() => reset()}
              className="px-5 py-2.5 bg-accent text-white font-medium rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-elevation-low"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
