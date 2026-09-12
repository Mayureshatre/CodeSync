import { describe, it, expect } from 'vitest';
import { getPollingCursor, Message } from '../../apps/web/src/hooks/useMessaging';

describe('Messaging Polling Logic', () => {
  it('returns undefined for empty messages array', () => {
    expect(getPollingCursor([])).toBeUndefined();
  });

  it('returns the newest message id', () => {
    const messages: Message[] = [
      { id: 'msg-1', body: 'Old', senderId: 'u1', conversationId: 'c1', createdAt: '1' },
      { id: 'msg-2', body: 'New', senderId: 'u2', conversationId: 'c1', createdAt: '2' }
    ];
    expect(getPollingCursor(messages)).toBe('msg-2');
  });

  it('filters out optimistic temp-* IDs', () => {
    const messages: Message[] = [
      { id: 'msg-1', body: 'Old', senderId: 'u1', conversationId: 'c1', createdAt: '1' },
      { id: 'msg-2', body: 'New real', senderId: 'u2', conversationId: 'c1', createdAt: '2' },
      { id: 'temp-1234', body: 'Optimistic', senderId: 'optimistic', conversationId: 'c1', createdAt: '3' }
    ];
    // Should skip temp-1234 and use msg-2
    expect(getPollingCursor(messages)).toBe('msg-2');
  });

  it('returns undefined if all messages are optimistic (edge case)', () => {
    const messages: Message[] = [
      { id: 'temp-1234', body: 'Optimistic', senderId: 'optimistic', conversationId: 'c1', createdAt: '3' }
    ];
    expect(getPollingCursor(messages)).toBeUndefined();
  });
});
