import { describe, it, expect, vi } from 'vitest';
import { GET } from '../../apps/web/app/api/health/route';
import { prisma } from '@codesync/core/db';
import { getMatchingQueue } from '@codesync/core/queue';

vi.mock('@codesync/core/db', () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}));

vi.mock('@codesync/core/queue', () => ({
  getMatchingQueue: vi.fn(),
}));

describe('GET /api/health', () => {
  it('returns 200 ok when both dependencies are healthy', async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([1]);
    
    const mockInfo = vi.fn().mockResolvedValue('PONG');
    vi.mocked(getMatchingQueue).mockReturnValue({
      backend: {
        connection: {
          client: Promise.resolve({ info: mockInfo }),
        },
      },
    } as any);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      status: 'ok',
      database: 'ok',
      redis: 'ok',
    });
  });

  it('returns 503 when PostgreSQL fails', async () => {
    vi.mocked(prisma.$queryRaw).mockRejectedValueOnce(new Error('Connection error'));
    
    const mockInfo = vi.fn().mockResolvedValue('PONG');
    vi.mocked(getMatchingQueue).mockReturnValue({
      backend: {
        connection: {
          client: Promise.resolve({ info: mockInfo }),
        },
      },
    } as any);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body).toEqual({
      status: 'error',
      database: 'error',
      redis: 'ok',
    });
  });

  it('returns 503 when Redis fails', async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([1]);
    
    const mockInfo = vi.fn().mockRejectedValue(new Error('Connection timeout'));
    vi.mocked(getMatchingQueue).mockReturnValue({
      backend: {
        connection: {
          client: Promise.resolve({ info: mockInfo }),
        },
      },
    } as any);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body).toEqual({
      status: 'error',
      database: 'ok',
      redis: 'error',
    });
  });
});
