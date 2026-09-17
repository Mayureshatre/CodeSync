import { renderHook, waitFor } from '@testing-library/react';
import { useRealtimeConversation } from '../../apps/web/src/hooks/useMessaging';
import { QueryClientProvider, QueryClient } from '../../apps/web/src/lib/queryClientHelper';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';

const mockPublish = vi.fn();
const mockSubscribe = vi.fn();
const mockUnsubscribe = vi.fn();
const mockClose = vi.fn();
const mockGetChannel = vi.fn().mockReturnValue({
  subscribe: mockSubscribe,
  unsubscribe: mockUnsubscribe,
  publish: mockPublish
});

const mockRealtime = vi.fn(function (this: any, options: any) {
  this.channels = { get: mockGetChannel };
  this.close = mockClose;
});

describe('useRealtimeConversation Typing Indicators', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    });
    vi.useFakeTimers({ shouldAdvanceTime: true });

    (global as any).window = (global as any).window || {};
    (global as any).window.Ably = { Realtime: mockRealtime };
    
    const mockScript: any = {};
    const originalGetElementById = document.getElementById.bind(document);
    vi.spyOn(document, 'getElementById').mockImplementation((id) => {
      if (id === 'ably-sdk') return null;
      return originalGetElementById(id);
    });

    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'script') {
        // Resolve immediately to avoid fake timer deadlock
        
        return mockScript as any;
      }
      return originalCreateElement(tag);
    });
    
    const originalAppendChild = document.body.appendChild.bind(document.body);
    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
      if (node === mockScript) { if (mockScript.onload) mockScript.onload(); return node; }
      return originalAppendChild(node);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it('adds user to typing cache on TypingStarted and removes on TypingStopped', async () => {
    renderHook(() => useRealtimeConversation('conv-123', 'current-user'), { wrapper });
    await waitFor(() => { expect(mockSubscribe).toHaveBeenCalledWith('TypingStarted', expect.any(Function)); });

    const onTypingStarted = mockSubscribe.mock.calls.find(c => c[0] === 'TypingStarted')[1];
    const onTypingStopped = mockSubscribe.mock.calls.find(c => c[0] === 'TypingStopped')[1];

    onTypingStarted({ data: { userId: 'user-2' } });
    
    expect(queryClient.getQueryData(['typing', 'conv-123'])).toEqual(['user-2']);

    onTypingStopped({ data: { userId: 'user-2' } });
    
    expect(queryClient.getQueryData(['typing', 'conv-123'])).toEqual([]);
  });

  it('auto-expires remote typing state after 3 seconds', async () => {
    renderHook(() => useRealtimeConversation('conv-123', 'current-user'), { wrapper });
    await waitFor(() => { expect(mockSubscribe).toHaveBeenCalledWith('TypingStarted', expect.any(Function)); });

    const onTypingStarted = mockSubscribe.mock.calls.find(c => c[0] === 'TypingStarted')[1];
    
    onTypingStarted({ data: { userId: 'user-2' } });
    expect(queryClient.getQueryData(['typing', 'conv-123'])).toEqual(['user-2']);

    vi.advanceTimersByTime(3100);
    
    expect(queryClient.getQueryData(['typing', 'conv-123'])).toEqual([]);
  });

  it('ignores own typing events safely', async () => {
    renderHook(() => useRealtimeConversation('conv-123', 'current-user'), { wrapper });
    await waitFor(() => { expect(mockSubscribe).toHaveBeenCalledWith('TypingStarted', expect.any(Function)); });

    const onTypingStarted = mockSubscribe.mock.calls.find(c => c[0] === 'TypingStarted')[1];
    onTypingStarted({ data: { userId: 'current-user' } });
    
    expect(queryClient.getQueryData(['typing', 'conv-123'])).toBeUndefined();
  });

  it('handles multiple typers correctly', async () => {
    renderHook(() => useRealtimeConversation('conv-123', 'current-user'), { wrapper });
    await waitFor(() => { expect(mockSubscribe).toHaveBeenCalledWith('TypingStarted', expect.any(Function)); });

    const onTypingStarted = mockSubscribe.mock.calls.find(c => c[0] === 'TypingStarted')[1];
    const onTypingStopped = mockSubscribe.mock.calls.find(c => c[0] === 'TypingStopped')[1];

    onTypingStarted({ data: { userId: 'user-2' } });
    onTypingStarted({ data: { userId: 'user-3' } });
    
    expect(queryClient.getQueryData(['typing', 'conv-123'])).toEqual(['user-2', 'user-3']);

    onTypingStopped({ data: { userId: 'user-2' } });
    expect(queryClient.getQueryData(['typing', 'conv-123'])).toEqual(['user-3']);
  });
  
  it('returns a publishTyping callback that publishes to the channel', async () => {
    const { result } = renderHook(() => useRealtimeConversation('conv-123', 'current-user'), { wrapper });
    await waitFor(() => { expect(mockSubscribe).toHaveBeenCalled(); });
    
    result.current.publishTyping(true);
    expect(mockPublish).toHaveBeenCalledWith('TypingStarted', { userId: 'current-user' });
    
    result.current.publishTyping(false);
    expect(mockPublish).toHaveBeenCalledWith('TypingStopped', { userId: 'current-user' });
  });

  it('ignores malformed events safely', async () => {
    renderHook(() => useRealtimeConversation('conv-123', 'current-user'), { wrapper });
    await waitFor(() => { expect(mockSubscribe).toHaveBeenCalledWith('TypingStarted', expect.any(Function)); });

    const onTypingStarted = mockSubscribe.mock.calls.find(c => c[0] === 'TypingStarted')[1];
    
    onTypingStarted({});
    expect(queryClient.getQueryData(['typing', 'conv-123'])).toBeUndefined();
    
    onTypingStarted({ data: {} });
    expect(queryClient.getQueryData(['typing', 'conv-123'])).toBeUndefined();
  });
});

