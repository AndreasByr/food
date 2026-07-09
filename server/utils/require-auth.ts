import { createAuthError } from './errors';

/**
 * Require an authenticated user for this request.
 *
 * Call at the top of any protected endpoint handler. Throws a structured 401
 * if `event.context.user` is absent (no token, invalid token, or expired token).
 *
 * Usage:
 *   export default defineEventHandler(async (event) => {
 *     const user = requireAuth(event);
 *     // user.id and user.email are typed and guaranteed non-null.
 *   });
 */
export function requireAuth(event: {
  context: { user?: { id: string; email: string } };
}): { id: string; email: string } {
  const user = event.context.user;
  if (!user) {
    throw createAuthError('Missing or invalid token');
  }
  return user;
}
