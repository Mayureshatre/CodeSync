import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyWorkspaceAccess } from '../../apps/web/src/server/services/workspaceService';
import { prisma } from '../../apps/web/src/server/db';

vi.mock('../../apps/web/src/server/db', () => ({
  prisma: {
    projectMember: { findFirst: vi.fn() },
    project: { findUnique: vi.fn() },
    workspace: { findUnique: vi.fn() }
  }
}));

describe('Workspace Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows owner to access workspace', async () => {
    vi.mocked(prisma.projectMember.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.project.findUnique).mockResolvedValue({ id: 'proj-1', ownerId: 'owner-1' } as any);
    vi.mocked(prisma.workspace.findUnique).mockResolvedValue({ id: 'ws-1', projectId: 'proj-1' } as any);

    const ws = await verifyWorkspaceAccess('proj-1', 'owner-1');
    expect(ws.id).toBe('ws-1');
  });

  it('allows active member to access workspace', async () => {
    vi.mocked(prisma.projectMember.findFirst).mockResolvedValue({ id: 'mem-1', userId: 'user-2', status: 'active' } as any);
    vi.mocked(prisma.project.findUnique).mockResolvedValue({ id: 'proj-1', ownerId: 'owner-1' } as any);
    vi.mocked(prisma.workspace.findUnique).mockResolvedValue({ id: 'ws-1', projectId: 'proj-1' } as any);

    const ws = await verifyWorkspaceAccess('proj-1', 'user-2');
    expect(ws.id).toBe('ws-1');
  });

  it('rejects non-members', async () => {
    vi.mocked(prisma.projectMember.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.project.findUnique).mockResolvedValue({ id: 'proj-1', ownerId: 'owner-1' } as any);

    await expect(verifyWorkspaceAccess('proj-1', 'user-3')).rejects.toThrow('You must be an active project member');
  });
});
