'use client';

import React from 'react';
import Image from 'next/image';
import { useConversations } from '../../hooks/useMessaging';
import { MessageSquareIcon } from 'lucide-react';

interface ConversationListProps {
  activeId?: string;
  onSelect: (id: string) => void;
  currentUserId: string;
}

export function ConversationList({ activeId, onSelect, currentUserId }: ConversationListProps) {
  const { data: conversations, isLoading, isError } = useConversations();

  if (isLoading) {
    return (
      <div className="p-8 text-center text-secondary animate-pulse flex flex-col items-center justify-center h-full">
        Loading...
      </div>
    );
  }

  if (isError || !conversations) {
    return (
      <div className="p-6 text-center text-error border-r border-border h-full flex items-center justify-center bg-error/5">
        <p className="font-medium">Failed to load conversations</p>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-secondary h-full border-r border-border">
        <div className="w-16 h-16 rounded-2xl bg-surface-elevated border border-border shadow-elevation-low flex items-center justify-center mb-6">
          <MessageSquareIcon className="w-8 h-8 text-muted" />
        </div>
        <p className="text-center text-sm font-medium">No conversations yet.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full border-r border-border overflow-y-auto bg-surface">
      {conversations.map((conv) => {
        const otherParticipant = conv.participants.find(p => p.userId !== currentUserId)?.user;
        const displayName = conv.type === 'project' ? `Project Chat` : (otherParticipant?.name || 'Unknown User');
        
        // Find latest message
        const latestMessage = conv.messages[0];
        
        // Unread check (if message is newer than lastReadAt)
        const isUnread = latestMessage && 
          (!conv.lastReadAt || new Date(latestMessage.createdAt) > new Date(conv.lastReadAt));

        return (
          <button
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={`w-full text-left p-4 sm:p-5 border-b border-border transition-all flex items-center gap-4 hover:bg-surface-elevated/70 group ${
              activeId === conv.id ? 'bg-surface-elevated border-l-2 border-l-accent' : 'border-l-2 border-l-transparent'
            }`}
          >
            <div className={`flex-shrink-0 w-12 h-12 rounded-full overflow-hidden flex items-center justify-center text-primary font-bold text-lg shadow-elevation-low ${
              activeId === conv.id ? 'bg-background border border-accent/20' : 'bg-background border border-border'
            }`}>
              {otherParticipant?.image ? (
                <Image src={otherParticipant.image} alt={displayName} width={48} height={48} className="object-cover" />
              ) : (
                <span>{displayName.charAt(0)}</span>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-1">
                <h3 className={`text-sm truncate transition-colors ${
                  isUnread ? 'text-primary font-bold' : activeId === conv.id ? 'text-accent font-semibold' : 'text-primary font-medium group-hover:text-accent'
                }`}>
                  {displayName}
                </h3>
                {latestMessage && (
                  <span className="text-[11px] font-mono tracking-wider text-muted whitespace-nowrap ml-2">
                    {new Date(latestMessage.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
              
              {latestMessage && (
                <p className={`text-xs truncate transition-colors ${isUnread ? 'text-primary font-medium' : 'text-secondary'}`}>
                  {latestMessage.body}
                </p>
              )}
            </div>
            
            {isUnread && (
              <div className="w-2.5 h-2.5 rounded-full bg-accent mt-0.5 flex-shrink-0 shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
            )}
          </button>
        );
      })}
    </div>
  );
}
