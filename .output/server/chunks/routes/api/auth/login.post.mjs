import { d as defineEventHandler, v as verifyPassword, s as signAccessToken, a as signRefreshToken, h as hashRefreshToken } from '../../../nitro/nitro.mjs';
import { eq } from 'drizzle-orm';
import { d as db, u as users, r as refreshTokens } from '../../../_/client.mjs';
import { v as validateBody, l as loginSchema } from '../../../_/validation.mjs';
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

const login_post = defineEventHandler(async (event) => {
  const body = await validateBody(event, loginSchema);
  const [user] = await db.select({
    id: users.id,
    email: users.email,
    name: users.name,
    passwordHash: users.passwordHash,
    createdAt: users.createdAt
  }).from(users).where(eq(users.email, body.email)).limit(1);
  if (!user) {
    throw createAuthError("Invalid email or password");
  }
  const valid = await verifyPassword(body.password, user.passwordHash);
  if (!valid) {
    throw createAuthError("Invalid email or password");
  }
  const accessToken = await signAccessToken(user.id, user.email);
  const [refreshRow] = await db.insert(refreshTokens).values({
    userId: user.id,
    tokenHash: "",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3)
  }).returning({ id: refreshTokens.id });
  const refreshToken = await signRefreshToken(user.id, refreshRow.id);
  const tokenHash = hashRefreshToken(refreshToken);
  await db.update(refreshTokens).set({ tokenHash }).where(eq(refreshTokens.id, refreshRow.id));
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt
    },
    accessToken,
    refreshToken
  };
});

export { login_post as default };
//# sourceMappingURL=login.post.mjs.map
