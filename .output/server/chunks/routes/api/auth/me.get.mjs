import { d as defineEventHandler, e as createError } from '../../../nitro/nitro.mjs';
import { eq } from 'drizzle-orm';
import { d as db, u as users } from '../../../_/client.mjs';
import { r as requireAuth } from '../../../_/require-auth.mjs';
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
import '../../../_/errors.mjs';

const me_get = defineEventHandler(async (event) => {
  const authUser = requireAuth(event);
  const [user] = await db.select({
    id: users.id,
    email: users.email,
    name: users.name,
    createdAt: users.createdAt
  }).from(users).where(eq(users.id, authUser.id)).limit(1);
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
      data: { statusCode: 401, message: "User not found" }
    });
  }
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt
  };
});

export { me_get as default };
//# sourceMappingURL=me.get.mjs.map
