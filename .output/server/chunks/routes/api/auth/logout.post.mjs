import { d as defineEventHandler, b as verifyRefreshToken, c as setResponseStatus } from '../../../nitro/nitro.mjs';
import { eq } from 'drizzle-orm';
import { d as db, r as refreshTokens } from '../../../_/client.mjs';
import { v as validateBody, r as refreshSchema } from '../../../_/validation.mjs';
import { c as createAuthError } from '../../../_/errors.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import 'bcryptjs';
import 'jose';
import 'drizzle-orm/postgres-js';
import 'postgres';
import 'drizzle-orm/pg-core';
import 'zod';

const logout_post = defineEventHandler(async (event) => {
  const body = await validateBody(event, refreshSchema);
  let payload;
  try {
    payload = await verifyRefreshToken(body.refreshToken);
  } catch {
    throw createAuthError("Invalid or expired refresh token");
  }
  await db.update(refreshTokens).set({ revokedAt: /* @__PURE__ */ new Date() }).where(eq(refreshTokens.id, payload.jti));
  setResponseStatus(event, 204);
  return null;
});

export { logout_post as default };
//# sourceMappingURL=logout.post.mjs.map
