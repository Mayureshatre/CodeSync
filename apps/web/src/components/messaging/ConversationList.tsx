'use client';

import React from 'react';
import { useConversations, Conversation } from '../../hooks/useMessaging';
import { Loader2Icon, MessageSquareIcon } from 'lucide-react';
import Image from 'next/image';

interface ConversationListProps {
  activeId?: string;
  onSelect: (id: string) => void;
  currentUserId: string;
}

export function ConversationList({ activeId, onSelect, currentUserId }: ConversationListProps) {
  const { data: conversations, isLoading, isError } = useConversations();

  if (isLoading) {
    return (
      <div className="flex justify-center p-8 border-r border-[#263042] h-full">
        <Loader2Icon className="w-6 h-6 text-[#06b6d4] animate-spin" />
      </div>
    );
  }

  if (isError || !conversations) {
    return (
      <div className="p-4 text-center text-red-500 border-r border-[#263042] h-full">
        Failed to load conversations
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-[#94a3b8] h-full border-r border-[#263042]">
        <MessageSquareIcon className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-center text-sm">No conversations yet.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full border-r border-[#263042] overflow-y-auto bg-[#181c24]">
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
            className={`w-full text-left p-4 border-b border-[#263042] transition-colors flex items-start gap-3 hover:bg-[#1e2433] ${
              activeId === conv.id ? 'bg-[#1e2433] border-l-2 border-l-[#06b6d4]' : ''
            }`}
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#263042] overflow-hidden flex items-center justify-center text-[#94a3b8]">
              {otherParticipant?.image ? (
                <Image src={otherParticipant.image} alt={displayName} width={40} height={40} className="object-cover" />
              ) : (
                <span className="text-lg font-bold">{displayName.charAt(0)}</span>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-1">
                <h3 className={`text-sm truncate ${isUnread ? 'text-white font-bold' : 'text-[#f1f5f9] font-medium'}`}>
                  {displayName}
                </h3>
                {latestMessage && (
                  <span className="text-xs text-[#64748b] whitespace-nowrap ml-2">
                    {new Date(latestMessage.createdAt).toLocaleDateString()}
                  </span>
                )}
              </div>
              
              {latestMessage && (
                <p className={`text-xs truncate ${isUnread ? 'text-[#06b6d4]' : 'text-[#94a3b8]'}`}>
                  {latestMessage.body}
                </p>
              )}
            </div>
            
            {isUnread && (
              <div className="w-2 h-2 rounded-full bg-[#06b6d4] mt-2 flex-shrink-0" />
            )}
          </button>
        );
      })}
    </div>
  );
}
