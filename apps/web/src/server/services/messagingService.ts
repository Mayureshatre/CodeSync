import { prisma } from '../db';
import { NotFoundError, ForbiddenError } from '../errors';
import { createNotification } from './notificationService';
import { SendMessageInput } from '../../lib/validations/messaging';

export async function createConversation(userId: string, opts: { targetUserId?: string; projectId?: string }) {
  if (opts.projectId) {
    // Project-scoped conversation
    const project = await prisma.project.findUnique({
      where: { id: opts.projectId },
      include: { projectMembers: true }
    });
    if (!project) throw new NotFoundError('Project not found');

    const isMember = project.projectMembers.some(m => m.userId === userId && m.status === 'active') || project.ownerId === userId;
    if (!isMember) throw new ForbiddenError('Only active members can access project conversations');

    // See if project conversation already exists
    const existing = await prisma.conversation.findFirst({
      where: { type: 'project', projectId: opts.projectId }
    });
    if (existing) return existing;

    // Build participant list
    const participants = project.projectMembers
      .filter(m => m.status === 'active')
      .map(m => m.userId);
    if (!participants.includes(project.ownerId)) participants.push(project.ownerId);

    return prisma.conversation.create({
      data: {
        type: 'project',
        projectId: opts.projectId,
        participants: {
          create: participants.map(id => ({ userId: id }))
        }
      }
    });
  }

  if (opts.targetUserId) {
    // DM conversation
    // See if one exists between these two users
    // This is a bit tricky in Prisma without a direct query, but we can do it by finding conversations
    // that have exactly these two participants.
    const existing = await prisma.conversation.findFirst({
      where: {
        type: 'dm',
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: opts.targetUserId } } }
        ]
      }
    });
    
    if (existing) return existing;

    return prisma.conversation.create({
      data: {
        type: 'dm',
        participants: {
          create: [
            { userId },
            { userId: opts.targetUserId }
          ]
        }
      }
    });
  }

  throw new Error('Invalid conversation parameters');
}

export async function getUserConversations(userId: string) {
  // Find all conversations where the user is a participant
  const participants = await prisma.conversationParticipant.findMany({
    where: { userId },
    select: { conversationId: true, lastReadAt: true }
  });

  const conversationIds = participants.map((p) => p.conversationId);

  // Fetch the actual conversations
  const conversations = await prisma.conversation.findMany({
    where: { id: { in: conversationIds } },
    include: {
      participants: {
        include: {
          user: {
            select: { 
              id: true, 
              profile: {
                select: { displayName: true, avatarUrl: true }
              }
            }
          }
        }
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1
      },
      _count: {
        select: { messages: true }
      }
    },
    orderBy: { updatedAt: 'desc' }
  });

  return conversations.map((conv) => {
    const userParticipant = participants.find((p) => p.conversationId === conv.id);
    const lastReadAt = userParticipant?.lastReadAt;

    return {
      ...conv,
      lastReadAt,
    };
  });
}

async function verifyParticipantAccess(userId: string, conversationId: string) {
  const participant = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: { conversationId, userId }
    },
    include: {
      conversation: true
    }
  });

  if (!participant) {
    throw new ForbiddenError('You are not a participant in this conversation');
  }

  // If project-scoped, ensure user is still an active ProjectMember or owner
  if (participant.conversation.type === 'project' && participant.conversation.projectId) {
    const project = await prisma.project.findUnique({
      where: { id: participant.conversation.projectId },
      include: { projectMembers: true }
    });

    if (!project) {
      throw new NotFoundError('Associated project not found');
    }

    const isOwner = project.ownerId === userId;
    const isMember = project.projectMembers.some((m) => m.userId === userId && m.status === 'active');

    if (!isOwner && !isMember) {
      throw new ForbiddenError('You are no longer an active member of this project');
    }
  }

  return participant;
}

export async function getMessages(
  userId: string, 
  conversationId: string, 
  limit: number = 50, 
  cursor?: string, 
  since?: string
) {
  await verifyParticipantAccess(userId, conversationId);

  const query: any = {
    where: { conversationId },
    take: limit + 1,
    orderBy: { createdAt: 'desc' } // Fetch newest first to paginate backwards, or oldest first for since
  };

  if (since) {
    query.where.id = { gt: since };
    query.orderBy = { id: 'asc' }; // For polling, fetch ascending
    query.take = limit; // Don't need nextCursor for polling
  } else if (cursor) {
    query.cursor = { id: cursor };
    query.skip = 1;
  }

  const messages = await prisma.message.findMany(query);

  let nextCursor: string | undefined = undefined;
  
  if (!since) {
    if (messages.length > limit) {
      const nextItem = messages.pop();
      nextCursor = nextItem?.id;
    }
    // Reverse messages so they are in chronological order for the UI
    messages.reverse();
  }

  return {
    items: messages,
    nextCursor
  };
}

export async function sendMessage(userId: string, conversationId: string, data: SendMessageInput) {
  const participant = await verifyParticipantAccess(userId, conversationId);

  // We need to atomically create the message and update Conversation.updatedAt
  const message = await prisma.$transaction(async (tx) => {
    const msg = await tx.message.create({
      data: {
        conversationId,
        senderId: userId,
        body: data.body
      }
    });

    await tx.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    return msg;
  });

  // Trigger MESSAGE notifications for all OTHER participants
  try {
    const otherParticipants = await prisma.conversationParticipant.findMany({
      where: { 
        conversationId,
        userId: { not: userId }
      }
    });

    for (const other of otherParticipants) {
      await createNotification(other.userId, 'MESSAGE', {
        event: 'message_received',
        conversationId,
        messageId: message.id,
        projectId: participant.conversation.projectId
      }).catch((e) => console.error(`Failed to dispatch message_received notification for user ${other.userId}`, e));
    }
  } catch (notifError) {
    console.error('Failed to query other participants for notification', notifError);
  }

  return message;
}

export async function markConversationAsRead(userId: string, conversationId: string) {
  const participant = await verifyParticipantAccess(userId, conversationId);

  const updated = await prisma.conversationParticipant.update({
    where: {
      conversationId_userId: { conversationId, userId }
    },
    data: {
      lastReadAt: new Date()
    }
  });

  return updated;
}
