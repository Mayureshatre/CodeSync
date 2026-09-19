import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname.startsWith('/auth');
    const hasProfile = token?.hasProfile as boolean | undefined;

    // Onboarding guard: logged in, but missing profile, not already on onboarding, not an API route
    if (isAuth && hasProfile === false && !req.nextUrl.pathname.startsWith('/onboarding') && !req.nextUrl.pathname.startsWith('/api') && !isAuthPage) {
      return NextResponse.redirect(new URL('/onboarding', req.url));
    }

    if (isAuthPage) {
      if (isAuth) {
        return NextResponse.redirect(new URL('/explore', req.url));
      }
      return null;
    }

    if (!isAuth) {
      if (req.nextUrl.pathname.startsWith('/api')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      let from = req.nextUrl.pathname;
      if (req.nextUrl.search) {
        from += req.nextUrl.search;
      }

      return NextResponse.redirect(
        new URL(`/auth/login?from=${encodeURIComponent(from)}`, req.url)
      );
    }
  },
  {
    callbacks: {
      authorized() {
        // This is a work-around for handling redirect on auth pages.
        // We return true here so that the middleware function above
        // is always called.
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/v1/auth (Custom auth API routes)
     * - api/auth (NextAuth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - / (landing page root)
     * - /explore (public discovery feed)
     * - /developers/:username (public developer profiles — (public) route group)
     * - /projects/:id exactly where :id is a cuid/uuid (public project detail).
     *   /projects/new and /projects/:id/edit and /projects/:id/workspace remain protected.
     * - /auth/ (auth pages handled separately by the second pattern)
     */
    '/((?!api/v1/auth|api/auth|_next/static|_next/image|favicon\\.ico|auth/|explore|developers/[^/]+$|projects/c[a-z0-9]{24}$|$).*)',
    '/auth/:path*',
  ],
};
