import type { H3Event, EventHandlerRequest } from 'h3';
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
export function requireAuth(event: H3Event<EventHandlerRequest>): { id: string; email: string } {
  const user = event.context.user as { id: string; email: string } | undefined;
  if (!user) {
    throw createAuthError('Missing or invalid token');
  }
  return user;
}
