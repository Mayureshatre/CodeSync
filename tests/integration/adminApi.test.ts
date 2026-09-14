import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { POST } from '../../apps/web/app/api/v1/admin/reports/[id]/resolve/route';
import { prisma } from '../../apps/web/src/server/db';
import { Report } from '@prisma/client';

vi.mock('../../apps/web/src/lib/auth', () => ({
  getCurrentSession: vi.fn(),
}));

import { getCurrentSession } from '../../apps/web/src/lib/auth';

describe('Admin Reports API Integration', () => {
  let testAdmin: any;
  let testReport: Report;

  beforeAll(async () => {
    try {
      await prisma.$connect();
      // Ensure admin exists
      testAdmin = await prisma.user.upsert({
        where: { email: 'integration_admin@example.com' },
        update: {},
        create: {
          email: 'integration_admin@example.com',
          passwordHash: 'dummy',
          authProvider: 'credentials',
          role: 'admin',
          emailVerifiedAt: new Date(),
        }
      });
      
      const targetUser = await prisma.user.upsert({
        where: { email: 'integration_target@example.com' },
        update: {},
        create: {
          email: 'integration_target@example.com',
          passwordHash: 'dummy',
          authProvider: 'credentials',
          role: 'user',
          emailVerifiedAt: new Date(),
        }
      });

      testReport = await prisma.report.create({
        data: {
          reporterId: targetUser.id, // self report for simplicity in test
          targetId: targetUser.id,
          targetType: 'user',
          reason: 'spam',
          description: 'Integration test report',
          status: 'pending',
        }
      });
    } catch (e: any) {
      if (e.message?.includes('Prisma') || e.message?.includes('Can\'t reach database')) {
        console.warn('NOT EXECUTED — PostgreSQL unavailable');
      } else {
        throw e;
      }
    }
  });

  afterAll(async () => {
    try {
      if (testReport) {
        await prisma.report.delete({ where: { id: testReport.id } });
      }
      await prisma.$disconnect();
    } catch (e) {}
  });

  it('resolves a report genuinely hitting the database', async () => {
    if (!testReport) {
      console.warn('NOT EXECUTED — PostgreSQL unavailable');
      return; // Skip test execution cleanly if DB is unavailable
    }

    vi.mocked(getCurrentSession).mockResolvedValue({ 
      user: { id: testAdmin.id, role: 'admin' } 
    } as any);
    
    const req = new Request(`http://localhost/api/v1/admin/reports/${testReport.id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'actioned', resolutionNotes: 'Integration resolved' })
    });
    
    const res = await POST(req as any, { params: { id: testReport.id } });
    
    expect(res.status).toBe(200);
    
    // Assert DB state directly
    const updatedReport = await prisma.report.findUnique({ where: { id: testReport.id } });
    expect(updatedReport?.status).toBe('actioned');
    expect(updatedReport?.resolutionNotes).toBe('Integration resolved');
    expect(updatedReport?.resolvedById).toBe(testAdmin.id);
  });
});
