'use client';

import React, { useState } from 'react';
import { ConversationList } from '../../../src/components/messaging/ConversationList';
import { MessageThread } from '../../../src/components/messaging/MessageThread';
import { MessageComposer } from '../../../src/components/messaging/MessageComposer';
import { useSession } from 'next-auth/react';
import { MessageSquareIcon, ArrowLeft } from 'lucide-react';

export default function MessagingPage() {
  const { data: session } = useSession();
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>();

  const userId = session?.user?.id;

  if (!userId) {
    return null; // Protected route handles redirect
  }

  return (
    <div className="flex h-[calc(100vh-64px)] w-full max-w-7xl mx-auto overflow-hidden bg-background">
      {/* Sidebar List */}
      <div className={`w-full md:w-1/3 flex-shrink-0 border-r border-border ${activeConversationId ? 'hidden md:block' : 'block'}`}>
        <ConversationList 
          activeId={activeConversationId} 
          onSelect={setActiveConversationId} 
          currentUserId={userId}
        />
      </div>

      {/* Main Thread Area */}
      <div className={`flex-1 flex flex-col bg-surface ${!activeConversationId ? 'hidden md:flex' : 'flex'}`}>
        {activeConversationId ? (
          <>
            {/* Mobile Back Button Header */}
            <div className="md:hidden px-4 py-3 border-b border-border bg-surface-elevated flex items-center shadow-elevation-low">
              <button 
                onClick={() => setActiveConversationId(undefined)} 
                className="flex items-center text-secondary hover:text-primary transition-colors text-sm font-medium gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Messages
              </button>
            </div>
            
            <MessageThread conversationId={activeConversationId} currentUserId={userId} />
            <MessageComposer conversationId={activeConversationId} />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-secondary bg-surface">
            <div className="w-16 h-16 rounded-2xl bg-surface-elevated border border-border shadow-elevation-low flex items-center justify-center mb-6">
              <MessageSquareIcon className="w-8 h-8 text-muted" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-primary mb-2">Your Messages</h2>
            <p className="text-sm">Select a conversation from the list to start messaging.</p>
          </div>
        )}
      </div>
    </div>
  );
}
