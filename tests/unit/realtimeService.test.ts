import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authorizeRealtimeChannel, getConversationChannelName, getAblyClient, _resetAblyClient } from '../../apps/web/src/server/services/realtimeService';
import { prisma } from '../../apps/web/src/server/db';

vi.mock('../../apps/web/src/server/db', () => ({
  prisma: {
    conversationParticipant: {
      findUnique: vi.fn()
    }
  }
}));

// Mock process.env
const originalEnv = process.env;

describe('Realtime Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _resetAblyClient();
    process.env = { ...originalEnv, ABLY_API_KEY: 'test-app:test-secret' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getConversationChannelName', () => {
    it('returns formatted channel name', () => {
      expect(getConversationChannelName('123')).toBe('private-conversation-123');
    });
  });

  describe('getAblyClient', () => {
    it('throws if ABLY_API_KEY is missing', () => {
      delete process.env.ABLY_API_KEY;
      expect(() => getAblyClient()).toThrow('ABLY_API_KEY environment variable is not configured');
    });

    it('returns an Ably Rest client', () => {
      const client = getAblyClient();
      expect(client).toBeDefined();
    });
  });

  describe('authorizeRealtimeChannel', () => {
    it('rejects channels that do not start with private-conversation-', async () => {
      await expect(authorizeRealtimeChannel('user-1', 'public-room'))
        .rejects
        .toThrow('Unsupported channel type');
    });

    it('rejects if user is not a participant', async () => {
      vi.mocked(prisma.conversationParticipant.findUnique).mockResolvedValue(null);
      
      await expect(authorizeRealtimeChannel('user-1', 'private-conversation-123'))
        .rejects
        .toThrow('Not authorized to access this conversation channel');
        
      expect(prisma.conversationParticipant.findUnique).toHaveBeenCalledWith({
        where: { conversationId_userId: { conversationId: '123', userId: 'user-1' } }
      });
    });

    it('returns token request with constrained capabilities if user is a participant', async () => {
      vi.mocked(prisma.conversationParticipant.findUnique).mockResolvedValue({ id: 'part-1' } as any);
      
      const result = await authorizeRealtimeChannel('user-1', 'private-conversation-123');
      
      expect(result).toBeDefined();
      expect(result.capability).toBeDefined();
      // Should include the channel and the capabilities
      const parsedCapability = JSON.parse(result.capability);
      expect(parsedCapability['private-conversation-123']).toContain('subscribe');
      expect(result.clientId).toBe('user-1');
    });
  });
});
