
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyCredentials } from '../../apps/web/src/server/services/authService';
import { prisma } from '../../apps/web/src/server/db';
import bcrypt from 'bcryptjs';

vi.mock('../../apps/web/src/server/db', () => ({
  prisma: { user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() } }
}));
vi.mock('bcryptjs', () => ({
  compare: vi.fn(), hash: vi.fn()
}));

describe('authService', () => {
  it('rejects suspended users', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'u1', email: 'x@y.com', passwordHash: 'pwd', status: 'suspended' } as any);
    await expect(verifyCredentials('x@y.com', 'password')).rejects.toThrow('Account suspended');
  });
});
