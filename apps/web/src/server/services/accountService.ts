import { prisma } from '../db';
import { NotFoundError, ConflictError } from '../errors';
import { getAccountDeletionGraceDays, enqueueAccountHardDelete, cancelAccountHardDelete } from './configService';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export async function requestAccountDeletion(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (user.status === 'deleted') {
    throw new ConflictError('Account is already permanently deleted');
  }

  const graceDays = await getAccountDeletionGraceDays();
  const delayMs = graceDays * MS_PER_DAY;

  // If already pending deletion, return existing scheduled details
  if (user.status === 'pending_deletion' && user.deletionRequestedAt) {
    return {
      status: user.status,
      deletionRequestedAt: user.deletionRequestedAt,
      graceDays,
      scheduledHardDeleteAt: new Date(user.deletionRequestedAt.getTime() + delayMs),
    };
  }

  const now = new Date();

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      status: 'pending_deletion',
      deletionRequestedAt: now,
    }
  });

  // Enqueue delayed hard deletion job
  await enqueueAccountHardDelete(userId, delayMs);

  return {
    status: updatedUser.status,
    deletionRequestedAt: updatedUser.deletionRequestedAt,
    graceDays,
    scheduledHardDeleteAt: new Date(now.getTime() + delayMs),
  };
}

export async function restoreAccount(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (user.status === 'deleted') {
    throw new ConflictError('Account has been permanently deleted');
  }

  if (user.status !== 'pending_deletion') {
    return {
      status: user.status,
      deletionRequestedAt: null,
      message: 'Account is already active'
    };
  }

  const graceDays = await getAccountDeletionGraceDays();
  const graceMs = graceDays * MS_PER_DAY;

  if (user.deletionRequestedAt && (Date.now() > user.deletionRequestedAt.getTime() + graceMs)) {
    throw new ConflictError('Account deletion grace period has expired');
  }

  const updateResult = await prisma.user.updateMany({
    where: {
      id: userId,
      status: 'pending_deletion',
    },
    data: {
      status: 'active',
      deletionRequestedAt: null,
    }
  });

  if (updateResult.count === 0) {
    const current = await prisma.user.findUnique({
      where: { id: userId },
      select: { status: true }
    });

    if (!current) {
      throw new NotFoundError('User not found');
    }

    if (current.status === 'deleted') {
      throw new ConflictError('Account has been permanently deleted');
    }

    return {
      status: current.status,
      deletionRequestedAt: null,
      message: 'Account is already active'
    };
  }

  // Cancel the pending delayed job
  await cancelAccountHardDelete(userId);

  return {
    status: 'active',
    deletionRequestedAt: null,
    message: 'Account successfully restored'
  };
}

export async function getAccountStatus(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      status: true,
      deletionRequestedAt: true,
    }
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const graceDays = await getAccountDeletionGraceDays();
  const scheduledHardDeleteAt = user.deletionRequestedAt
    ? new Date(user.deletionRequestedAt.getTime() + graceDays * MS_PER_DAY)
    : null;

  return {
    id: user.id,
    email: user.email,
    status: user.status,
    deletionRequestedAt: user.deletionRequestedAt,
    graceDays,
    scheduledHardDeleteAt,
  };
}
