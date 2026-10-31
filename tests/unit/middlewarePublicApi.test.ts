import { describe, it, expect, vi } from 'vitest';
import { isPublicApiGetRequest } from '../../apps/web/src/lib/publicApi';

const { mockWithAuth, getCapturedMiddleware } = vi.hoisted(() => {
  let captured: any = null;
  return {
    mockWithAuth: vi.fn((fn: any) => {
      captured = fn;
      return fn;
    }),
    getCapturedMiddleware: () => captured,
  };
});

vi.mock('next-auth/middleware', () => ({
  withAuth: mockWithAuth,
}));

// Import middleware to trigger withAuth invocation
import '../../apps/web/middleware';

describe('Public API Helper (isPublicApiGetRequest)', () => {
  it('allows anonymous GET on /api/v1/developers', () => {
    expect(isPublicApiGetRequest({
      method: 'GET',
      nextUrl: { pathname: '/api/v1/developers' },
    })).toBe(true);
  });

  it('allows anonymous GET on /api/v1/developers with trailing slash', () => {
    expect(isPublicApiGetRequest({
      method: 'GET',
      nextUrl: { pathname: '/api/v1/developers/' },
    })).toBe(true);
  });

  it('allows anonymous GET on /api/v1/projects', () => {
    expect(isPublicApiGetRequest({
      method: 'GET',
      nextUrl: { pathname: '/api/v1/projects' },
    })).toBe(true);
  });

  it('allows anonymous GET on /api/v1/projects with trailing slash', () => {
    expect(isPublicApiGetRequest({
      method: 'GET',
      nextUrl: { pathname: '/api/v1/projects/' },
    })).toBe(true);
  });

  it('allows anonymous GET on /api/v1/skills', () => {
    expect(isPublicApiGetRequest({
      method: 'GET',
      nextUrl: { pathname: '/api/v1/skills' },
    })).toBe(true);
  });

  it('allows anonymous GET on /api/v1/skills with trailing slash', () => {
    expect(isPublicApiGetRequest({
      method: 'GET',
      nextUrl: { pathname: '/api/v1/skills/' },
    })).toBe(true);
  });

  it('blocks anonymous POST on /api/v1/projects', () => {
    expect(isPublicApiGetRequest({
      method: 'POST',
      nextUrl: { pathname: '/api/v1/projects' },
    })).toBe(false);
  });

  it('blocks anonymous POST on /api/v1/developers', () => {
    expect(isPublicApiGetRequest({
      method: 'POST',
      nextUrl: { pathname: '/api/v1/developers' },
    })).toBe(false);
  });

  it('blocks anonymous POST on /api/v1/skills', () => {
    expect(isPublicApiGetRequest({
      method: 'POST',
      nextUrl: { pathname: '/api/v1/skills' },
    })).toBe(false);
  });

  it('blocks anonymous PUT, PATCH, DELETE on projects', () => {
    for (const method of ['PUT', 'PATCH', 'DELETE']) {
      expect(isPublicApiGetRequest({
        method,
        nextUrl: { pathname: '/api/v1/projects' },
      })).toBe(false);
    }
  });

  it('blocks nested protected project routes even on GET', () => {
    const protectedGetPaths = [
      '/api/v1/projects/me',
      '/api/v1/projects/proj-1/workspace',
      '/api/v1/projects/proj-1/applications',
      '/api/v1/projects/proj-1/invitations',
      '/api/v1/projects/proj-1/publish',
      '/api/v1/projects/proj-1/complete',
      '/api/v1/projects/proj-1/reviews',
    ];

    for (const pathname of protectedGetPaths) {
      expect(isPublicApiGetRequest({
        method: 'GET',
        nextUrl: { pathname },
      })).toBe(false);
    }
  });

  it('blocks other protected GET endpoints', () => {
    const protectedEndpoints = [
      '/api/v1/admin/skills',
      '/api/v1/matches/developers',
      '/api/v1/conversations',
      '/api/v1/notifications',
      '/api/v1/reports',
      '/api/v1/saved-projects',
      '/api/v1/saved-developers',
      '/api/v1/users',
      '/api/v1/profiles/me',
    ];

    for (const pathname of protectedEndpoints) {
      expect(isPublicApiGetRequest({
        method: 'GET',
        nextUrl: { pathname },
      })).toBe(false);
    }
  });
});

describe('Middleware Request Interception', () => {
  function createMockMiddlewareRequest(options: {
    method: string;
    pathname: string;
    search?: string;
    token?: any;
  }) {
    const url = `http://localhost:3000${options.pathname}${options.search || ''}`;
    return {
      method: options.method,
      url,
      nextUrl: {
        pathname: options.pathname,
        search: options.search || '',
        href: url,
      },
      nextauth: {
        token: options.token || null,
      },
    };
  }

  it('allows unauthenticated GET /api/v1/developers?q=Elena to pass through', async () => {
    const req = createMockMiddlewareRequest({
      method: 'GET',
      pathname: '/api/v1/developers',
      search: '?q=Elena',
      token: null,
    });

    const middlewareFn = getCapturedMiddleware();
    const res = middlewareFn(req);
    // Allowed requests return NextResponse.next() (status 200 / headers empty, not 401)
    expect(res).toBeDefined();
    expect(res.status).not.toBe(401);
  });

  it('allows unauthenticated GET /api/v1/projects to pass through', async () => {
    const req = createMockMiddlewareRequest({
      method: 'GET',
      pathname: '/api/v1/projects',
      search: '?difficulty=intermediate',
      token: null,
    });

    const middlewareFn = getCapturedMiddleware();
    const res = middlewareFn(req);
    expect(res).toBeDefined();
    expect(res.status).not.toBe(401);
  });

  it('allows unauthenticated GET /api/v1/skills to pass through', async () => {
    const req = createMockMiddlewareRequest({
      method: 'GET',
      pathname: '/api/v1/skills',
      search: '?q=React',
      token: null,
    });

    const middlewareFn = getCapturedMiddleware();
    const res = middlewareFn(req);
    expect(res).toBeDefined();
    expect(res.status).not.toBe(401);
  });

  it('rejects unauthenticated POST /api/v1/projects with HTTP 401', async () => {
    const req = createMockMiddlewareRequest({
      method: 'POST',
      pathname: '/api/v1/projects',
      token: null,
    });

    const middlewareFn = getCapturedMiddleware();
    const res = middlewareFn(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('rejects unauthenticated GET /api/v1/projects/me with HTTP 401', async () => {
    const req = createMockMiddlewareRequest({
      method: 'GET',
      pathname: '/api/v1/projects/me',
      token: null,
    });

    const middlewareFn = getCapturedMiddleware();
    const res = middlewareFn(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('rejects unauthenticated GET /api/v1/matches/developers with HTTP 401', async () => {
    const req = createMockMiddlewareRequest({
      method: 'GET',
      pathname: '/api/v1/matches/developers',
      search: '?projectId=proj-1',
      token: null,
    });

    const middlewareFn = getCapturedMiddleware();
    const res = middlewareFn(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('rejects unauthenticated GET /api/v1/admin/skills with HTTP 401', async () => {
    const req = createMockMiddlewareRequest({
      method: 'GET',
      pathname: '/api/v1/admin/skills',
      token: null,
    });

    const middlewareFn = getCapturedMiddleware();
    const res = middlewareFn(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('redirects unauthenticated page request to /auth/login', async () => {
    const req = createMockMiddlewareRequest({
      method: 'GET',
      pathname: '/dashboard',
      token: null,
    });

    const middlewareFn = getCapturedMiddleware();
    const res = middlewareFn(req);
    expect(res.status).toBe(307); // NextResponse.redirect
    expect(res.headers.get('location')).toContain('/auth/login?from=%2Fdashboard');
  });

  it('allows authenticated requests through without 401', async () => {
    const req = createMockMiddlewareRequest({
      method: 'POST',
      pathname: '/api/v1/projects',
      token: { id: 'user-1', hasProfile: true },
    });

    const middlewareFn = getCapturedMiddleware();
    const res = middlewareFn(req);
    expect(res?.status).not.toBe(401);
  });
});
