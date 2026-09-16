import { renderHook, waitFor } from '@testing-library/react';
import { useRealtimeConversation, Message } from '../../apps/web/src/hooks/useMessaging';
import { QueryClientProvider, QueryClient } from '../../apps/web/src/lib/queryClientHelper';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';

const mockSubscribe = vi.fn();
const mockUnsubscribe = vi.fn();
const mockClose = vi.fn();
const mockGetChannel = vi.fn().mockReturnValue({
  subscribe: mockSubscribe,
  unsubscribe: mockUnsubscribe,
});

const mockRealtime = vi.fn(function (this: any, options: any) {
  this.channels = { get: mockGetChannel };
  this.close = mockClose;
  // Expose for tests
  (global as any).mockAblyClient = this;
  (global as any).mockAblyOptions = options;
});

describe('useRealtimeConversation', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    });

    (global as any).window = (global as any).window || {};
    (global as any).window.Ably = {
      Realtime: mockRealtime
    };
    
    // Mock document.getElementById and document.createElement for the script injection
    const mockScript: any = {
      addEventListener: vi.fn((event, cb) => {
        if (event === 'load') cb();
      })
    };
    const originalGetElementById = document.getElementById.bind(document);
    vi.spyOn(document, 'getElementById').mockImplementation((id) => {
      if (id === 'ably-sdk') return null;
      return originalGetElementById(id);
    });

    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'script') {
        setTimeout(() => {
          if (mockScript.onload) mockScript.onload();
        }, 0);
        return mockScript as any;
      }
      return originalCreateElement(tag);
    });

    const originalAppendChild = document.body.appendChild.bind(document.body);
    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
      if (node === mockScript) return node;
      return originalAppendChild(node);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (global as any).mockAblyClient;
    delete (global as any).mockAblyOptions;
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it('subscribes to the correct channel on mount', async () => {
    renderHook(() => useRealtimeConversation('conv-123'), { wrapper });

    await waitFor(() => {
      expect(mockRealtime).toHaveBeenCalled();
    });

    expect(mockGetChannel).toHaveBeenCalledWith('private-conversation-conv-123');
    expect(mockSubscribe).toHaveBeenCalledWith('NewMessage', expect.any(Function));
  });

  it('unsubscribes and closes connection on unmount', async () => {
    const { unmount } = renderHook(() => useRealtimeConversation('conv-123'), { wrapper });

    await waitFor(() => {
      expect(mockRealtime).toHaveBeenCalled();
    });

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalledWith('NewMessage', expect.any(Function));
    expect(mockClose).toHaveBeenCalled();
  });

  it('updates query cache when a new message is received', async () => {
    // Seed initial cache
    queryClient.setQueryData(['conversations', 'conv-123', 'messages'], {
      pages: [{ items: [{ id: 'msg-1', body: 'Hello' }] }],
      pageParams: [undefined]
    });

    renderHook(() => useRealtimeConversation('conv-123'), { wrapper });

    await waitFor(() => {
      expect(mockSubscribe).toHaveBeenCalled();
    });

    const onMessage = mockSubscribe.mock.calls[0][1];

    // Simulate incoming message
    onMessage({
      data: {
        id: 'msg-2',
        body: 'World',
        conversationId: 'conv-123',
        senderId: 'user-2',
        createdAt: new Date().toISOString()
      }
    });

    const cachedData = queryClient.getQueryData<any>(['conversations', 'conv-123', 'messages']);
    expect(cachedData.pages[0].items).toHaveLength(2);
    expect(cachedData.pages[0].items[1].id).toBe('msg-2');
  });

  it('deduplicates incoming messages based on id', async () => {
    queryClient.setQueryData(['conversations', 'conv-123', 'messages'], {
      pages: [{ items: [{ id: 'msg-1', body: 'Hello' }] }],
      pageParams: [undefined]
    });

    renderHook(() => useRealtimeConversation('conv-123'), { wrapper });

    await waitFor(() => {
      expect(mockSubscribe).toHaveBeenCalled();
    });

    const onMessage = mockSubscribe.mock.calls[0][1];

    // Simulate incoming duplicate message
    onMessage({
      data: {
        id: 'msg-1', // duplicate!
        body: 'Hello again',
        conversationId: 'conv-123',
        senderId: 'user-2',
        createdAt: new Date().toISOString()
      }
    });

    const cachedData = queryClient.getQueryData<any>(['conversations', 'conv-123', 'messages']);
    expect(cachedData.pages[0].items).toHaveLength(1); // Still 1
  });
});
