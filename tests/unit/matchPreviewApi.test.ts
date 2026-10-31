import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../../apps/web/app/api/v1/projects/[id]/match-preview/route';
import { getServerSession } from 'next-auth';
import { prisma } from '../../apps/web/src/server/db';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('../../apps/web/src/lib/auth', () => ({
  authOptions: {},
}));

vi.mock('../../apps/web/src/server/db', () => ({
  prisma: {
    project: {
      findUnique: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
  },
}));

describe('GET /api/v1/projects/[id]/match-preview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 if requester is unauthenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/v1/projects/p1/match-preview');
    const res = await GET(req, { params: { id: 'p1' } });

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 404 if project does not exist', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'owner-1' } } as any);
    vi.mocked(prisma.project.findUnique).mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/v1/projects/non-existent/match-preview');
    const res = await GET(req, { params: { id: 'non-existent' } });

    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toContain('not found');
  });

  it('returns 403 if requester is not the project owner', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'stranger-1' } } as any);
    vi.mocked(prisma.project.findUnique).mockResolvedValue({
      id: 'p1',
      ownerId: 'owner-1',
      status: 'draft',
      projectSkills: [],
    } as any);

    const req = new Request('http://localhost:3000/api/v1/projects/p1/match-preview');
    const res = await GET(req, { params: { id: 'p1' } });

    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toContain('owner');
  });

  it('returns preview candidates ranked by match score for draft projects', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'owner-1' } } as any);
    vi.mocked(prisma.project.findUnique).mockResolvedValue({
      id: 'p1',
      ownerId: 'owner-1',
      status: 'draft',
      collaborationType: ['open_source'],
      projectSkills: [
        { skillId: 's-ts', requirementType: 'required', minProficiency: 'intermediate', skill: { name: 'TypeScript' } },
      ],
    } as any);

    vi.mocked(prisma.user.findMany).mockResolvedValue([
      {
        id: 'dev-matching',
        profile: {
          username: 'elena',
          displayName: 'Elena Rostova',
          avatarUrl: null,
          experienceLevel: 'advanced',
          availability: 'available',
          preferredCollaboration: ['open_source'],
        },
        userSkills: [
          { skillId: 's-ts', proficiency: 'expert', skill: { name: 'TypeScript' } },
        ],
      },
      {
        id: 'dev-unmatched',
        profile: {
          username: 'python_dev',
          displayName: 'Python Dev',
          avatarUrl: null,
          experienceLevel: 'intermediate',
          availability: 'available',
          preferredCollaboration: ['open_source'],
        },
        userSkills: [
          { skillId: 's-py', proficiency: 'expert', skill: { name: 'Python' } },
        ],
      },
    ] as any);

    const req = new Request('http://localhost:3000/api/v1/projects/p1/match-preview');
    const res = await GET(req, { params: { id: 'p1' } });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.projectId).toBe('p1');
    expect(data.totalMatched).toBe(1);
    expect(data.previews.length).toBe(1);
    expect(data.previews[0].username).toBe('elena');
    expect(data.previews[0].score).toBeGreaterThan(70);
    expect(data.previews[0].explanation).toBeDefined();
  });
});
