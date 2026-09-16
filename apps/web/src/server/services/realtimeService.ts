import * as Ably from 'ably';
import { prisma } from '../db';
import { ForbiddenError, ValidationError } from '../errors';

let ablyClient: Ably.Rest | null = null;

export function getAblyClient(): Ably.Rest {
  const apiKey = process.env.ABLY_API_KEY;
  if (!apiKey) {
    throw new Error('ABLY_API_KEY environment variable is not configured');
  }
  
  if (!ablyClient) {
    ablyClient = new Ably.Rest({ key: apiKey });
  }
  
  return ablyClient;
}

// Reset function for testing purposes
export function _resetAblyClient() {
  ablyClient = null;
}

export function getConversationChannelName(conversationId: string): string {
  return `private-conversation-${conversationId}`;
}

export async function authorizeRealtimeChannel(userId: string, channelName: string) {
  if (!channelName.startsWith('private-conversation-')) {
    throw new ValidationError('Unsupported channel type');
  }

  const conversationId = channelName.replace('private-conversation-', '');
  
  // Verify the user is a participant
  const participant = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: {
        conversationId,
        userId
      }
    }
  });

  if (!participant) {
    throw new ForbiddenError('Not authorized to access this conversation channel');
  }

  const client = getAblyClient();

  // Create a token request granting access ONLY to the requested channel
  const tokenRequest = await client.auth.createTokenRequest({
    clientId: userId,
    capability: {
      [channelName]: ['subscribe', 'publish', 'presence']
    }
  });

  return tokenRequest;
}
