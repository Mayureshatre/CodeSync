'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSendMessage } from '../../hooks/useMessaging';
import { SendIcon } from 'lucide-react';

interface MessageComposerProps {
  conversationId: string;
  onTyping?: (isTyping: boolean) => void;
}

export function MessageComposer({ conversationId, onTyping }: MessageComposerProps) {
  const [body, setBody] = useState('');
  const { mutate: sendMessage, isPending } = useSendMessage(conversationId);
  const isTypingRef = useRef(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerTyping = () => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      if (onTyping) onTyping(true);
    }
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      if (onTyping) onTyping(false);
    }, 2000);
  };

  const clearTyping = () => {
    if (isTypingRef.current) {
      isTypingRef.current = false;
      if (onTyping) onTyping(false);
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  useEffect(() => {
    return () => clearTyping();
  }, [conversationId]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBody(e.target.value);
    if (e.target.value.trim()) {
      triggerTyping();
    } else {
      clearTyping();
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || isPending) return;

    sendMessage(body.trim(), {
      onSuccess: () => {
        setBody('');
        clearTyping();
      }
    });
  };

  return (
    <form 
      onSubmit={handleSend} 
      className="p-4 sm:p-5 bg-surface border-t border-border flex items-end gap-3 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]"
    >
      <div className="flex-1 bg-background border border-border rounded-2xl shadow-elevation-flat relative focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 transition-all">
        <textarea
          value={body}
          onChange={handleChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend(e);
            }
          }}
          placeholder="Type a message..."
          className="w-full bg-transparent px-5 py-3.5 text-sm text-primary placeholder:text-muted focus:outline-none resize-none max-h-32 min-h-[52px]"
          disabled={isPending}
          maxLength={2000}
          rows={1}
        />
      </div>
      <button
        type="submit"
        disabled={!body.trim() || isPending}
        className="p-3.5 rounded-2xl bg-accent text-white shadow-elevation-low disabled:opacity-50 disabled:bg-surface-elevated disabled:text-muted transition-all hover:opacity-90 active:scale-95 flex-shrink-0"
        title="Send Message"
      >
        <SendIcon className="w-5 h-5" />
      </button>
    </form>
  );
}
