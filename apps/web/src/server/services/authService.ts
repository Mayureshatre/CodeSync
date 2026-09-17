import { prisma } from '../db';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { ConflictError, AuthenticationError, NotFoundError } from '../errors';
import { getEmailTransport } from './emailTransport';

export async function generateVerificationToken(email: string) {
  // 32 random bytes = 64 hex characters (cryptographically secure)
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours

  // Upsert to handle re-sending without bloating DB
  const verificationToken = await prisma.verificationToken.findFirst({ where: { email } });
  
  if (verificationToken) {
    return prisma.verificationToken.update({
      where: { id: verificationToken.id },
      data: { token, expiresAt, createdAt: new Date() },
    });
  }

  return prisma.verificationToken.create({
    data: {
      email,
      token,
      expiresAt,
    },
  });
}

export async function sendVerificationEmail(email: string, token: string) {
  const transport = getEmailTransport();
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const verificationUrl = `${baseUrl}/auth/verify-email?token=${token}`;

  await transport.sendEmail({
    to: email,
    subject: 'Verify your CodeSync email address',
    textBody: `Please verify your email by opening this link: ${verificationUrl}`,
    htmlBody: `<p>Please verify your email by clicking <a href="${verificationUrl}">here</a>.</p>`
  });
}

export async function verifyEmailToken(token: string) {
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token }
  });

  if (!verificationToken) {
    throw new AuthenticationError('Invalid or expired verification token');
  }

  if (verificationToken.expiresAt < new Date()) {
    // Delete expired token to keep DB clean
    await prisma.verificationToken.delete({ where: { id: verificationToken.id } });
    throw new AuthenticationError('Verification token has expired');
  }

  const user = await prisma.user.findUnique({ where: { email: verificationToken.email } });
  
  if (!user) {
    // Edge case: user deleted account before verifying
    await prisma.verificationToken.delete({ where: { id: verificationToken.id } });
    throw new NotFoundError('User not found');
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date() }
    }),
    prisma.verificationToken.delete({
      where: { id: verificationToken.id }
    })
  ]);

  return user;
}

export async function resendVerificationEmail(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user || user.emailVerifiedAt || user.authProvider !== 'credentials') {
    // Return silently to avoid leaking account existence or auth method
    return;
  }

  const existingToken = await prisma.verificationToken.findFirst({ where: { email } });
  if (existingToken && (Date.now() - existingToken.createdAt.getTime() < 60000)) {
    // Rate limit: generated less than 1 minute ago.
    // Return silently to avoid being an email spam vector.
    return;
  }

  const vToken = await generateVerificationToken(email);
  await sendVerificationEmail(email, vToken.token).catch(e => {
    console.error('Failed to dispatch resend verification email:', e);
  });
}

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

  // Only send verification for credentials signup
  if (password) {
    const vToken = await generateVerificationToken(email);
    // Best effort delivery, don't block user creation if email service fails briefly
    await sendVerificationEmail(email, vToken.token).catch(e => {
      console.error('Failed to dispatch verification email during registration:', e);
    });
  }

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
