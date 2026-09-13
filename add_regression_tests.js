const fs = require('fs');
const path = require('path');

// 1. Auth test
const authTestPath = path.join(__dirname, 'tests/unit/authService.test.ts');
if (fs.existsSync(authTestPath)) {
  let authTest = fs.readFileSync(authTestPath, 'utf8');
  if (!authTest.includes('Account suspended')) {
    authTest = authTest.replace(
      `it('rejects invalid password', async () => {`,
      `it('rejects suspended users', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'u1',
      email: 'test@test.com',
      passwordHash: 'hashed',
      status: 'suspended'
    } as any);
    await expect(verifyCredentials('test@test.com', 'password')).rejects.toThrow('Account suspended');
  });

  it('rejects invalid password', async () => {`
    );
    fs.writeFileSync(authTestPath, authTest);
    console.log('Added suspended auth test');
  }
} else {
  fs.writeFileSync(authTestPath, `
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
`);
  console.log('Created authService.test.ts');
}

// 2. Discovery test
const discTestPath = path.join(__dirname, 'tests/unit/discoveryService.test.ts');
if (fs.existsSync(discTestPath)) {
  let discTest = fs.readFileSync(discTestPath, 'utf8');
  if (!discTest.includes('moderationHidden')) {
    discTest = discTest.replace(
      `describe('discoveryService', () => {`,
      `describe('discoveryService', () => {
  it('excludes moderationHidden projects', async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValue([]);
    await searchProjects(null, { limit: 10 });
    const calls = vi.mocked(prisma.$queryRaw).mock.calls;
    const queryArg = calls[0][0];
    expect(queryArg.strings.some(s => s.includes('moderationHidden" = false')) || queryArg.values.some(v => typeof v === 'string' && v.includes('moderationHidden" = false'))).toBe(true);
  });`
    );
    fs.writeFileSync(discTestPath, discTest);
    console.log('Added moderationHidden test');
  }
}
