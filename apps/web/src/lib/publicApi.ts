/**
 * Exact pathname set for API endpoints that permit unauthenticated GET requests.
 * Mutating methods (POST, PUT, PATCH, DELETE) and nested sub-resources
 * (e.g., /projects/me, /projects/:id/workspace) remain strictly protected.
 */
export const PUBLIC_API_GET_PATHS = new Set<string>([
  '/api/v1/developers',
  '/api/v1/projects',
  '/api/v1/skills',
]);

/**
 * Checks if an incoming request is an allowed unauthenticated GET request.
 * Normalizes trailing slashes and ensures method is strictly 'GET'.
 */
export function isPublicApiGetRequest(req: {
  method?: string;
  nextUrl?: { pathname: string };
}): boolean {
  if (req.method !== 'GET') {
    return false;
  }
  const pathname = req.nextUrl?.pathname?.replace(/\/$/, '') || '';
  return PUBLIC_API_GET_PATHS.has(pathname);
}
