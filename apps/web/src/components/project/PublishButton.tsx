"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export function PublishButton({ projectId }: { projectId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handlePublish = async () => {
    setIsLoading(true);
    setError(null);
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

  if (isSuccess) return null;

  return (
    <>
      <button 
        onClick={handlePublish}
        disabled={isLoading}
        className="flex-1 sm:flex-none px-5 py-2.5 bg-accent hover:opacity-90 active:scale-[0.98] text-white font-medium rounded-xl flex items-center justify-center transition-all duration-200 shadow-elevation-low disabled:opacity-50 disabled:active:scale-100"
      >
        {isLoading && <Loader2 className="animate-spin w-4 h-4 mr-2" />}
        Publish
      </button>
      {error && <span className="text-error text-sm w-full sm:w-auto">{error}</span>}
    </>
  );
}
