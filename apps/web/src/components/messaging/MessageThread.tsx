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
  const flatMessages = [...pages].reverse().flatMap(p => p.items);

  // Poll for new messages using the ID of the absolute newest REAL message
  const pollingCursor = getPollingCursor(flatMessages);
  
  useNewMessagesPolling(conversationId, pollingCursor);

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
  }, [pages.length, flatMessages.length, isFetchingNextPage]);

  if (isLoading) {
    return (
      <div className="flex-1 flex justify-center items-center bg-background">
        <Loader2Icon className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-6 bg-background gap-5">
      {hasNextPage && (
        <div className="text-center pb-4">
          <button 
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="text-xs font-medium px-4 py-1.5 rounded-full bg-surface-elevated border border-border text-secondary hover:text-accent hover:border-accent transition-all shadow-elevation-low disabled:opacity-50"
          >
            {isFetchingNextPage ? 'Loading older messages...' : 'Load older messages'}
          </button>
        </div>
      )}

      {flatMessages.map((msg, index) => {
        const isMine = msg.senderId === currentUserId;
        const isOptimistic = msg.senderId === 'optimistic';
        
        return (
          <div key={msg.id || index} className={`flex flex-col w-full ${isMine || isOptimistic ? 'items-end' : 'items-start'}`}>
            <div 
              className={`px-5 py-3 rounded-2xl max-w-[85%] sm:max-w-[70%] text-[15px] leading-relaxed shadow-elevation-flat ${
                isMine || isOptimistic
                  ? 'bg-accent text-white rounded-br-sm' 
                  : 'bg-surface border border-border text-primary rounded-bl-sm'
              } ${isOptimistic ? 'opacity-70 scale-[0.98] transition-all' : ''}`}
            >
              {msg.body}
            </div>
            <span className="text-[11px] font-mono tracking-wider text-muted mt-1.5 px-1">
              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        );
      })}
      
      <div ref={bottomRef} className="h-1" />
    </div>
  );
}
