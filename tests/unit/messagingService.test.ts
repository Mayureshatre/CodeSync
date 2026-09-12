import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '../../apps/web/src/server/db';
import { sendMessage, getMessages, getUserConversations, markConversationAsRead } from '../../apps/web/src/server/services/messagingService';
import { createNotification } from '../../apps/web/src/server/services/notificationService';
import { ForbiddenError, NotFoundError } from '../../apps/web/src/server/errors';

vi.mock('../../apps/web/src/server/db', () => ({
  prisma: {
    conversationParticipant: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn()
    },
    conversation: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn()
    },
    message: {
      create: vi.fn(),
      findMany: vi.fn()
    },
    project: {
      findUnique: vi.fn()
    },
    $transaction: vi.fn((callback) => callback(prisma))
  }
}));

vi.mock('../../apps/web/src/server/services/notificationService', () => ({
  createNotification: vi.fn().mockResolvedValue({})
}));

describe('Messaging Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Participant Authorization', () => {
    it('throws ForbiddenError if user is not a participant', async () => {
      vi.mocked(prisma.conversationParticipant.findUnique).mockResolvedValueOnce(null);

      await expect(sendMessage('user-1', 'conv-1', { body: 'Hello' }))
        .rejects.toThrow(ForbiddenError);
    });

    it('throws ForbiddenError if project-scoped and user is removed', async () => {
      vi.mocked(prisma.conversationParticipant.findUnique).mockResolvedValueOnce({
        id: 'cp-1', conversationId: 'conv-1', userId: 'user-1', lastReadAt: null,
        conversation: { id: 'conv-1', type: 'project', projectId: 'proj-1', updatedAt: new Date() }
      } as any);

      vi.mocked(prisma.project.findUnique).mockResolvedValueOnce({
        id: 'proj-1', ownerId: 'owner-1',
        projectMembers: [{ userId: 'user-1', status: 'removed' }]
      } as any);

      await expect(sendMessage('user-1', 'conv-1', { body: 'Hello' }))
        .rejects.toThrow(ForbiddenError);
    });
  });

  describe('Sending Messages', () => {
    it('creates message, updates conversation, and triggers notification', async () => {
      const mockParticipant = {
        id: 'cp-1', conversationId: 'conv-1', userId: 'user-1', lastReadAt: null,
        conversation: { id: 'conv-1', type: 'dm', projectId: null, updatedAt: new Date() }
      };

      vi.mocked(prisma.conversationParticipant.findUnique).mockResolvedValueOnce(mockParticipant as any);
      vi.mocked(prisma.message.create).mockResolvedValueOnce({ id: 'msg-1', body: 'Hi', senderId: 'user-1' } as any);
      
      // Mock other participants for notification
      vi.mocked(prisma.conversationParticipant.findMany).mockResolvedValueOnce([
        { userId: 'user-2' } as any
      ]);

      const result = await sendMessage('user-1', 'conv-1', { body: 'Hi' });

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.message.create).toHaveBeenCalledWith({
        data: { conversationId: 'conv-1', senderId: 'user-1', body: 'Hi' }
      });
      expect(prisma.conversation.update).toHaveBeenCalledWith({
        where: { id: 'conv-1' },
        data: { updatedAt: expect.any(Date) }
      });
      
      // Must notify recipients, NOT the sender
      expect(createNotification).toHaveBeenCalledWith('user-2', 'MESSAGE', expect.objectContaining({
        event: 'message_received',
        messageId: 'msg-1'
      }));
      expect(createNotification).toHaveBeenCalledTimes(1);

      expect(result.id).toBe('msg-1');
    });
  });

  describe('Fetching Messages', () => {
    it('returns messages in reverse order for correct UI display (cursor pagination)', async () => {
      vi.mocked(prisma.conversationParticipant.findUnique).mockResolvedValueOnce({
        id: 'cp-1', conversationId: 'conv-1', userId: 'user-1',
        conversation: { type: 'dm' }
      } as any);

      // Backend returns ordered desc from DB
      vi.mocked(prisma.message.findMany).mockResolvedValueOnce([
        { id: 'msg-3' }, { id: 'msg-2' }
      ] as any);

      const result = await getMessages('user-1', 'conv-1', 2);
      
      expect(prisma.message.findMany).toHaveBeenCalledWith(expect.objectContaining({
        take: 3,
        orderBy: { createdAt: 'desc' }
      }));

      // Service should reverse them to chronological for the UI
      expect(result.items[0].id).toBe('msg-2');
      expect(result.items[1].id).toBe('msg-3');
    });

    it('fetches forward for polling with since parameter', async () => {
      vi.mocked(prisma.conversationParticipant.findUnique).mockResolvedValueOnce({
        id: 'cp-1', conversationId: 'conv-1', userId: 'user-1',
        conversation: { type: 'dm' }
      } as any);

      vi.mocked(prisma.message.findMany).mockResolvedValueOnce([{ id: 'msg-4' }] as any);

      const result = await getMessages('user-1', 'conv-1', 50, undefined, 'msg-3');

      expect(prisma.message.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { conversationId: 'conv-1', id: { gt: 'msg-3' } },
        orderBy: { id: 'asc' }
      }));
    });
  });

  describe('Participant & DM Isolation', () => {
    it('isolates DM access to exact participants', async () => {
      // Simulate another user trying to access a DM they are not in
      vi.mocked(prisma.conversationParticipant.findUnique).mockResolvedValueOnce(null);

      await expect(getMessages('unauthorized-user', 'dm-conv-1'))
        .rejects.toThrow(ForbiddenError);
    });
  });

  describe('Read State', () => {
    it('updates lastReadAt for the correct participant', async () => {
      vi.mocked(prisma.conversationParticipant.findUnique).mockResolvedValueOnce({
        id: 'cp-1', conversationId: 'conv-1', userId: 'user-1',
        conversation: { type: 'dm' }
      } as any);

      vi.mocked(prisma.conversationParticipant.update).mockResolvedValueOnce({
        id: 'cp-1', lastReadAt: new Date()
      } as any);

      await markConversationAsRead('user-1', 'conv-1');

      expect(prisma.conversationParticipant.update).toHaveBeenCalledWith({
        where: { conversationId_userId: { conversationId: 'conv-1', userId: 'user-1' } },
        data: { lastReadAt: expect.any(Date) }
      });
    });
  });
});
