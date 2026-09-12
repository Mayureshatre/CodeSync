'use client';

import React, { useEffect, useRef } from 'react';
import { useHistoricalMessages, useNewMessagesPolling, useMarkAsRead, Message, getPollingCursor } from '../../hooks/useMessaging';
import { Loader2Icon } from 'lucide-react';

interface MessageThreadProps {
  conversationId: string;
  currentUserId: string;
}

export function MessageThread({ conversationId, currentUserId }: MessageThreadProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useHistoricalMessages(conversationId);
  const { mutate: markRead } = useMarkAsRead(conversationId);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  const pages = data?.pages || [];
  
  // The pages are ordered such that page 0 has the newest messages, page 1 has older, etc.
  // But inside each page, messages are chronological (older first, newer last),
  // OR the array is sorted. Our backend returns `messages.reverse()` meaning older first.
  // We want to render older messages at the top, newer at the bottom.
  // So we should map pages from last to first.
  const flatMessages = [...pages].reverse().flatMap(p => p.items);

  // Poll for new messages using the ID of the absolute newest REAL message
  const pollingCursor = getPollingCursor(flatMessages);
  
  useNewMessagesPolling(conversationId, pollingCursor);

  // The 'newestMessage' used for marking read can remain the raw newest message (even if optimistic),
  // since reading an optimistic message doesn't hurt, but marking read usually depends on real messages anyway.
  // We'll use pollingCursor for that too just to be safe.
  useEffect(() => {
    if (pollingCursor) {
      markRead();
    }
  }, [pollingCursor, markRead]);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (!isFetchingNextPage && flatMessages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [pages.length, flatMessages.length, isFetchingNextPage]); // Scroll when a new page is added (like optimistic insert)

  if (isLoading) {
    return (
      <div className="flex-1 flex justify-center items-center bg-[#141822]">
        <Loader2Icon className="w-8 h-8 text-[#06b6d4] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-4 bg-[#141822] gap-4">
      {hasNextPage && (
        <div className="text-center pb-4">
          <button 
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="text-xs text-[#06b6d4] hover:underline"
          >
            {isFetchingNextPage ? 'Loading...' : 'Load older messages'}
          </button>
        </div>
      )}

      {flatMessages.map((msg, index) => {
        const isMine = msg.senderId === currentUserId;
        const isOptimistic = msg.senderId === 'optimistic';
        
        return (
          <div key={msg.id || index} className={`flex flex-col ${isMine || isOptimistic ? 'items-end' : 'items-start'}`}>
            <div 
              className={`px-4 py-2 rounded-[12px] max-w-[80%] text-sm ${
                isMine || isOptimistic
                  ? 'bg-[#06b6d4] text-[#0a0e16] rounded-br-none' 
                  : 'bg-[#1e2433] text-[#f1f5f9] rounded-bl-none border border-[#263042]'
              } ${isOptimistic ? 'opacity-70' : ''}`}
            >
              {msg.body}
            </div>
            <span className="text-[10px] text-[#64748b] mt-1 px-1">
              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        );
      })}
      
      <div ref={bottomRef} />
    </div>
  );
}
