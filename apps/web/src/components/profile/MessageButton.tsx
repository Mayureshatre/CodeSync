'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { MessageSquare, Loader2 } from 'lucide-react';
import { useCreateConversation } from '../../hooks/useMessaging';

interface MessageButtonProps {
  developerUserId: string;
  developerName: string;
}

export function MessageButton({ developerUserId, developerName }: MessageButtonProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { mutateAsync: createConversation, isPending } = useCreateConversation();
  const [error, setError] = useState<string | null>(null);

  // Safety guard: do not show button if viewing own profile
  if (session?.user?.id && session.user.id === developerUserId) {
    return null;
  }

  const handleMessage = async () => {
    // Unauthenticated: redirect to login
    if (status === 'unauthenticated' || !session?.user) {
      router.push('/login');
      return;
    }

    if (isPending) return;

    setError(null);
    try {
      const conversation = await createConversation({ targetUserId: developerUserId });
      if (conversation?.id) {
        router.push(`/messages?conversationId=${encodeURIComponent(conversation.id)}`);
      } else {
        router.push('/messages');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to start conversation. Please try again.');
    }
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleMessage}
        disabled={isPending}
        aria-label={`Message ${developerName}`}
        className="px-5 py-2.5 bg-surface-elevated hover:bg-accent/10 hover:text-accent text-primary border border-border hover:border-accent/40 font-medium rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-elevation-low min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-accent" />
            <span>Starting...</span>
          </>
        ) : (
          <>
            <MessageSquare className="w-4 h-4" />
            <span>Message</span>
          </>
        )}
      </button>

      {error && (
        <span role="alert" className="text-xs text-error font-medium px-1 mt-0.5">
          {error}
        </span>
      )}
    </div>
  );
}
