import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MessageComposer } from '../../apps/web/src/components/messaging/MessageComposer';
import { QueryClient, QueryClientProvider } from '../../apps/web/src/lib/queryClientHelper';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

vi.mock('../../apps/web/src/hooks/useMessaging', () => ({
  useSendMessage: () => ({ mutate: vi.fn(), isPending: false })
}));

describe('MessageComposer Typing Logic', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('calls onTyping(true) when user types and false when they stop', () => {
    const mockOnTyping = vi.fn();
    render(<MessageComposer conversationId="conv-123" onTyping={mockOnTyping} />, { wrapper });
    
    const textarea = screen.getByPlaceholderText(/Type a message/i);
    fireEvent.change(textarea, { target: { value: 'a' } });
    
    expect(mockOnTyping).toHaveBeenCalledWith(true);
    expect(mockOnTyping).toHaveBeenCalledTimes(1);
    
    // Type more quickly, shouldn't call again
    fireEvent.change(textarea, { target: { value: 'ab' } });
    expect(mockOnTyping).toHaveBeenCalledTimes(1);
    
    // Wait for debounce timeout
    vi.advanceTimersByTime(2100);
    expect(mockOnTyping).toHaveBeenCalledWith(false);
  });

  it('calls onTyping(false) immediately if user clears textarea', () => {
    const mockOnTyping = vi.fn();
    render(<MessageComposer conversationId="conv-123" onTyping={mockOnTyping} />, { wrapper });
    
    const textarea = screen.getByPlaceholderText(/Type a message/i);
    fireEvent.change(textarea, { target: { value: 'a' } });
    expect(mockOnTyping).toHaveBeenCalledWith(true);
    
    fireEvent.change(textarea, { target: { value: '' } });
    expect(mockOnTyping).toHaveBeenCalledWith(false);
  });
});
