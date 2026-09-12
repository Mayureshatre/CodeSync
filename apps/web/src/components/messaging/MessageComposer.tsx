'use client';

import React, { useState } from 'react';
import { useSendMessage } from '../../hooks/useMessaging';
import { SendIcon } from 'lucide-react';

export function MessageComposer({ conversationId }: { conversationId: string }) {
  const [body, setBody] = useState('');
  const { mutate: sendMessage, isPending } = useSendMessage(conversationId);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || isPending) return;

    sendMessage(body.trim(), {
      onSuccess: () => setBody('')
    });
  };

  return (
    <form 
      onSubmit={handleSend} 
      className="p-4 bg-[#181c24] border-t border-[#263042] flex items-center gap-2"
    >
      <input
        type="text"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Type a message..."
        className="flex-1 bg-[#141822] border border-[#263042] rounded-[8px] px-4 py-2 text-sm text-[#f1f5f9] placeholder-[#64748b] focus:outline-none focus:border-[#06b6d4]"
        disabled={isPending}
        maxLength={2000}
      />
      <button
        type="submit"
        disabled={!body.trim() || isPending}
        className="p-2 rounded-[8px] bg-[#06b6d4] text-[#0a0e16] disabled:opacity-50 transition-opacity hover:opacity-80"
      >
        <SendIcon className="w-5 h-5" />
      </button>
    </form>
  );
}
