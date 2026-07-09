import { d as defineEventHandler, f as hashPassword, s as signAccessToken, a as signRefreshToken, h as hashRefreshToken, c as setResponseStatus } from '../../../nitro/nitro.mjs';
import { eq } from 'drizzle-orm';
import { d as db, u as users, r as refreshTokens } from '../../../_/client.mjs';
import { v as validateBody, a as registerSchema } from '../../../_/validation.mjs';
import { a as createConflictError } from '../../../_/errors.mjs';
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

const register_post = defineEventHandler(async (event) => {
  var _a;
  const body = await validateBody(event, registerSchema);
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, body.email)).limit(1);
  if (existing.length > 0) {
    throw createConflictError("A user with this email already exists");
  }
  const passwordHash = await hashPassword(body.password);
  const [user] = await db.insert(users).values({
    email: body.email,
    passwordHash,
    name: (_a = body.name) != null ? _a : null
  }).returning({
    id: users.id,
    email: users.email,
    name: users.name,
    createdAt: users.createdAt
  });
  const accessToken = await signAccessToken(user.id, user.email);
  const [refreshRow] = await db.insert(refreshTokens).values({
    userId: user.id,
    tokenHash: "",
    // placeholder — updated below after we have the raw token
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3)
  }).returning({ id: refreshTokens.id });
  const refreshToken = await signRefreshToken(user.id, refreshRow.id);
  const tokenHash = hashRefreshToken(refreshToken);
  await db.update(refreshTokens).set({ tokenHash }).where(eq(refreshTokens.id, refreshRow.id));
  setResponseStatus(event, 201);
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

export { register_post as default };
//# sourceMappingURL=register.post.mjs.map
