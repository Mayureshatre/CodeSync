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
    <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded shadow max-w-lg mx-auto mt-10">
      <h2 className="text-xl font-bold text-gray-900 mb-2">Unexpected Error</h2>
      <p className="text-gray-600 mb-4 text-center">Something went wrong while loading this page.</p>
      {error.digest && <p className="text-xs text-gray-400 mb-4">Error ID: {error.digest}</p>}
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
      >
        Try again
      </button>
    </div>
  );
}
