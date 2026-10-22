'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { AlertTriangle, RotateCcw, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function PendingDeletionBanner() {
  const { data: session, update } = useSession();
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (session?.user?.status !== 'pending_deletion') {
    return null;
  }

  const handleRestore = async () => {
    setIsRestoring(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/users/me/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to restore account');
      }

      // Update session to reflect active status
      await update();
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to restore account');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div
      role="alert"
      className="bg-amber-500/10 border-b border-amber-500/30 text-amber-600 dark:text-amber-400 px-4 py-3 sm:px-6"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2 text-center sm:text-left">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>
            <strong>Account Scheduled for Deletion:</strong> Your account is currently in the grace period and will be permanently deleted soon.
          </span>
        </div>
        <div className="flex items-center gap-3">
          {error && <span className="text-xs text-error font-medium">{error}</span>}
          <button
            onClick={handleRestore}
            disabled={isRestoring}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium text-xs shadow-sm transition-colors disabled:opacity-50 min-h-[36px]"
          >
            {isRestoring ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Restoring...
              </>
            ) : (
              <>
                <RotateCcw className="w-3.5 h-3.5" />
                Restore Account
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
