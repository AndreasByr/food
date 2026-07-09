import { d as defineEventHandler } from '../../nitro/nitro.mjs';
import { eq, asc } from 'drizzle-orm';
import { d as db, i as ingredients } from '../../_/client.mjs';
import { r as requireAuth } from '../../_/require-auth.mjs';
import { m as mapIngredient } from '../../_/recipe-validation.mjs';
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
import '../../_/errors.mjs';
import 'zod';
import 'drizzle-zod';

const index_get = defineEventHandler(async (event) => {
  const user = requireAuth(event);
  const rows = await db.select().from(ingredients).where(eq(ingredients.userId, user.id)).orderBy(asc(ingredients.name));
  return rows.map(mapIngredient);
});

export { index_get as default };
//# sourceMappingURL=index.get.mjs.map
