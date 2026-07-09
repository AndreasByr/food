import { d as defineEventHandler, b as verifyRefreshToken, h as hashRefreshToken, s as signAccessToken, a as signRefreshToken } from '../../../nitro/nitro.mjs';
import { eq, and, isNull } from 'drizzle-orm';
import { d as db, r as refreshTokens, u as users } from '../../../_/client.mjs';
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

const refresh_post = defineEventHandler(async (event) => {
  const body = await validateBody(event, refreshSchema);
  let payload;
  try {
    payload = await verifyRefreshToken(body.refreshToken);
  } catch {
    throw createAuthError("Invalid or expired refresh token");
  }
  const [row] = await db.select({
    id: refreshTokens.id,
    userId: refreshTokens.userId,
    tokenHash: refreshTokens.tokenHash,
    revokedAt: refreshTokens.revokedAt,
    expiresAt: refreshTokens.expiresAt
  }).from(refreshTokens).where(eq(refreshTokens.id, payload.jti)).limit(1);
  if (!row) {
    throw createAuthError("Invalid or expired refresh token");
  }
  if (row.revokedAt) {
    await db.update(refreshTokens).set({ revokedAt: /* @__PURE__ */ new Date() }).where(
      and(
        eq(refreshTokens.userId, row.userId),
        isNull(refreshTokens.revokedAt)
      )
    );
    throw createAuthError("Refresh token has been revoked");
  }
  if (new Date(row.expiresAt) < /* @__PURE__ */ new Date()) {
    throw createAuthError("Refresh token has expired");
  }
  const expectedHash = hashRefreshToken(body.refreshToken);
  if (row.tokenHash !== expectedHash) {
    throw createAuthError("Invalid refresh token");
  }
  await db.update(refreshTokens).set({ revokedAt: /* @__PURE__ */ new Date() }).where(eq(refreshTokens.id, row.id));
  const [user] = await db.select({ id: users.id, email: users.email }).from(users).where(eq(users.id, row.userId)).limit(1);
  if (!user) {
    throw createAuthError("User not found");
  }
  const accessToken = await signAccessToken(user.id, user.email);
  const [newRefreshRow] = await db.insert(refreshTokens).values({
    userId: user.id,
    tokenHash: "",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3)
  }).returning({ id: refreshTokens.id });
  const refreshToken = await signRefreshToken(user.id, newRefreshRow.id);
  const tokenHash = hashRefreshToken(refreshToken);
  await db.update(refreshTokens).set({ tokenHash }).where(eq(refreshTokens.id, newRefreshRow.id));
  return { accessToken, refreshToken };
});

export { refresh_post as default };
//# sourceMappingURL=refresh.post.mjs.map
