import { prisma } from '../db';
import bcrypt from 'bcryptjs';
import { ConflictError, AuthenticationError } from '../errors';

export async function registerUser({ email, password }: { email: string; password?: string }) {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new ConflictError('A user with this email already exists.');
  }

  const passwordHash = password ? await bcrypt.hash(password, 10) : null;

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      authProvider: password ? 'credentials' : 'oauth',
    },
  });

  return user;
}

export async function verifyCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.passwordHash) {
    throw new AuthenticationError('Invalid credentials');
  }

  if (user.status === 'suspended') {
    throw new AuthenticationError('Account suspended');
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);

  if (!isValid) {
    throw new AuthenticationError('Invalid credentials');
  }

  return user;
}

export async function invalidateUserSessions(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { sessionVersion: { increment: 1 } },
  });
}
