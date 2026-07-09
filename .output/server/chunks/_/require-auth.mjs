import { c as createAuthError } from './errors.mjs';

function requireAuth(event) {
  const user = event.context.user;
  if (!user) {
    throw createAuthError("Missing or invalid token");
  }
  return user;
}

export { requireAuth as r };
//# sourceMappingURL=require-auth.mjs.map
