import { verifyAccessToken } from '../utils/auth';

/**
 * Auth context middleware — runs on every request.
 *
 * Reads the Authorization header. If a valid Bearer access token is present,
 * attaches the decoded user to `event.context.user`. Does NOT reject if the
 * token is missing or invalid — protected endpoints opt in via `requireAuth()`.
 *
 * This runs AFTER rate limiting (01.rate-limit.ts) so rate-limited requests
 * are rejected before we spend cycles verifying a JWT.
 */
export default defineEventHandler(async (event) => {
  // Only process API routes.
  if (!event.path.startsWith('/api/')) return;

  const header = event.headers.get('authorization');
  if (!header) return;

  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return;

  try {
    const payload = await verifyAccessToken(token);
    event.context.user = {
      id: payload.sub,
      email: payload.email,
    };
  } catch {
    // Token invalid or expired — silently ignore. The endpoint's requireAuth()
    // will reject with a proper 401 if the route is protected.
  }
});
