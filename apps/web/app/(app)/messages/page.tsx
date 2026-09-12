'use client';

import React, { useState, useEffect } from 'react';
import { ConversationList } from '../../../src/components/messaging/ConversationList';
import { MessageThread } from '../../../src/components/messaging/MessageThread';
import { MessageComposer } from '../../../src/components/messaging/MessageComposer';
import { useSession } from 'next-auth/react';
import { MessageSquareIcon } from 'lucide-react';

export default function MessagingPage() {
  const { data: session } = useSession();
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>();

  const userId = session?.user?.id;

  if (!userId) {
    return null; // Protected route handles redirect
  }

  return (
    <div className="flex h-[calc(100vh-64px)] w-full max-w-7xl mx-auto overflow-hidden bg-[#0a0e16]">
      {/* Sidebar List */}
      <div className={`w-full md:w-1/3 flex-shrink-0 ${activeConversationId ? 'hidden md:block' : 'block'}`}>
        <ConversationList 
          activeId={activeConversationId} 
          onSelect={setActiveConversationId} 
          currentUserId={userId}
        />
      </div>

      {/* Main Thread Area */}
      <div className={`flex-1 flex flex-col ${!activeConversationId ? 'hidden md:flex' : 'flex'}`}>
        {activeConversationId ? (
          <>
            {/* Mobile Back Button Header */}
            <div className="md:hidden p-4 border-b border-[#263042] bg-[#181c24] flex items-center gap-2">
              <button onClick={() => setActiveConversationId(undefined)} className="text-[#06b6d4] text-sm">
                &larr; Back
              </button>
            </div>
            
            <MessageThread conversationId={activeConversationId} currentUserId={userId} />
            <MessageComposer conversationId={activeConversationId} />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[#94a3b8] bg-[#141822]">
            <MessageSquareIcon className="w-16 h-16 mb-4 opacity-50" />
            <h2 className="text-xl font-medium text-white mb-2">Your Messages</h2>
            <p>Select a conversation from the list to start messaging.</p>
          </div>
        )}
      </div>
    </div>
  );
}
