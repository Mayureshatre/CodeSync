'use client';
import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function Error({
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
    <div className="flex flex-col items-center justify-center p-8 bg-surface border border-border shadow-elevation-flat rounded-2xl max-w-lg mx-auto mt-10">
      <h2 className="text-xl font-bold text-primary mb-2">Unexpected Error</h2>
      <p className="text-secondary mb-6 text-center">Something went wrong while loading this page.</p>
      {error.digest && <p className="text-xs text-muted font-mono mb-4 bg-surface-elevated px-2 py-1 rounded">Error ID: {error.digest}</p>}
      <button
        onClick={() => reset()}
        className="px-5 py-2.5 bg-accent text-white font-medium rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-elevation-low"
      >
        Try again
      </button>
    </div>
  );
}
