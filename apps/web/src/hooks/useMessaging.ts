import { useEffect } from 'react';
import type { Message as AblyMessage } from 'ably';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
};

/**
 * Returns the most recent real server-generated message ID to use as a polling cursor.
 * Excludes optimistic temporary IDs (temp-*) to prevent sending invalid cursors to the backend.
 */
export function getPollingCursor(messages: Message[]): string | undefined {
  const realMessages = messages.filter(m => !m.id.startsWith('temp-'));
  if (realMessages.length === 0) return undefined;
  // Assuming messages array is in chronological order (oldest first, newest last)
  // as rendered by MessageThread.
  return realMessages[realMessages.length - 1]?.id;
}

export type Conversation = {
  id: string;
  type: 'dm' | 'project';
  projectId: string | null;
  updatedAt: string;
  lastReadAt?: string;
  participants: { userId: string; user: { id: string; name: string; image: string | null } }[];
  messages: Message[];
  _count: { messages: number };
};

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await fetch('/api/v1/conversations');
      if (!res.ok) throw new Error('Failed to load conversations');
      const json = await res.json();
      return json.data as Conversation[];
    }
  });
}

// For polling, we will use a separate query or rely on a standard query with refetchInterval
// But since we want cursor pagination AND polling, we usually separate them.
// A simple approach for MVP:
// 1. Initial load + historical uses useInfiniteQuery (no polling).
// 2. A separate useQuery polls for new messages using ?since= 
// Let's implement the infinite query first.
export function useHistoricalMessages(conversationId: string) {
  return useInfiniteQuery({
    queryKey: ['conversations', conversationId, 'messages'],
    queryFn: async ({ pageParam }) => {
      const url = new URL(`/api/v1/conversations/${conversationId}/messages`, window.location.origin);
      if (pageParam) url.searchParams.set('cursor', pageParam);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('Failed to fetch messages');
      const json = await res.json();
      return json.data as { items: Message[]; nextCursor?: string };
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor
  });
}

export function useNewMessagesPolling(conversationId: string, since?: string) {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: ['conversations', conversationId, 'polling', since],
    queryFn: async () => {
      if (!since) return null;
      const res = await fetch(`/api/v1/conversations/${conversationId}/messages?since=${since}`);
      if (!res.ok) return null;
      const json = await res.json();
      const newMessages = json.data.items as Message[];
      
      if (newMessages.length > 0) {
        // Manually push to the infinite query cache
        queryClient.setQueryData(
          ['conversations', conversationId, 'messages'],
          (oldData: any) => {
            if (!oldData) return oldData;
            const newPages = [...oldData.pages];
            // Push new messages to the first page (since it holds the newest items chronologically)
            // Wait, chronological order: older messages are in next pages. 
            // The first page holds the newest messages at the end.
            const firstPage = { ...newPages[0] };
            firstPage.items = [...firstPage.items, ...newMessages];
            newPages[0] = firstPage;
            return { ...oldData, pages: newPages };
          }
        );
        // Also invalidate the conversation list to update recent message
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }
      return newMessages;
    },
    enabled: !!since,
    refetchInterval: 5000, // Poll every 5s per ARCHITECTURE.md
  });
}

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: string) => {
      const res = await fetch(`/api/v1/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body })
      });
      if (!res.ok) throw new Error('Failed to send message');
      const json = await res.json();
      return json.data as Message;
    },
    onMutate: async (body) => {
      await queryClient.cancelQueries({ queryKey: ['conversations', conversationId, 'messages'] });
      const previousData = queryClient.getQueryData(['conversations', conversationId, 'messages']);

      // Optimistic update
      queryClient.setQueryData(['conversations', conversationId, 'messages'], (oldData: any) => {
        if (!oldData) return oldData;
        const newPages = [...oldData.pages];
        const firstPage = { ...newPages[0] };
        
        const optimisticMsg: Message = {
          id: `temp-${Date.now()}`,
          conversationId,
          senderId: 'optimistic', // Real sender id replaced by server
          body,
          createdAt: new Date().toISOString()
        };
        
        firstPage.items = [...firstPage.items, optimisticMsg];
        newPages[0] = firstPage;
        return { ...oldData, pages: newPages };
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['conversations', conversationId, 'messages'], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', conversationId, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  });
}

export function useMarkAsRead(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/conversations/${conversationId}/read`, { method: 'PATCH' });
      if (!res.ok) throw new Error('Failed to mark read');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  });
}

export function useRealtimeConversation(conversationId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!conversationId) return;

    let client: any = null;
    let channel: any = null;
    let onMessage: any = null;

    const initAbly = () => {
      const Ably = (window as any).Ably;
      if (!Ably) return; // Should not happen since we wait for script load

      client = new Ably.Realtime({
        authCallback: async (tokenParams: any, callback: any) => {
        try {
          const res = await fetch('/api/v1/realtime/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ channelName: `private-conversation-${conversationId}` })
          });
          if (!res.ok) throw new Error('Realtime auth failed');
          const tokenRequest = await res.json();
          callback(null, tokenRequest);
        } catch (err) {
          callback(err as any, null);
        }
      }
    });

    const channelName = `private-conversation-${conversationId}`;
    channel = client.channels.get(channelName);

    onMessage = (message: AblyMessage) => {
      // Guard payload
      if (!message.data || typeof message.data !== 'object') return;
      const newMsg = message.data as Message;
      if (!newMsg.id || !newMsg.body) return;

      queryClient.setQueryData(
        ['conversations', conversationId, 'messages'],
        (oldData: any) => {
          if (!oldData) return oldData;
          
          // Check for duplicates
          const allItems = oldData.pages.flatMap((p: any) => p.items);
          if (allItems.some((m: any) => m.id === newMsg.id)) {
            return oldData;
          }

          const newPages = [...oldData.pages];
          const firstPage = { ...newPages[0] };
          firstPage.items = [...firstPage.items, newMsg];
          newPages[0] = firstPage;
          return { ...oldData, pages: newPages };
        }
      );
      
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };

    channel.subscribe('NewMessage', onMessage);
  };

  const existingScript = document.getElementById('ably-sdk');
  if (!existingScript) {
    const script = document.createElement('script');
    script.src = '/api/v1/ably-sdk';
    script.id = 'ably-sdk';
    script.async = true;
    script.onload = initAbly;
    document.body.appendChild(script);
  } else {
    if ((window as any).Ably) {
      initAbly();
    } else {
      existingScript.addEventListener('load', initAbly);
    }
  }

  return () => {
    if (channel && onMessage) {
      channel.unsubscribe('NewMessage', onMessage);
    }
    if (client) {
      client.close();
    }
  };
}, [conversationId, queryClient]);
}
