import { d as defineEventHandler, i as getQuery } from '../../nitro/nitro.mjs';
import { eq, and, asc } from 'drizzle-orm';
import { a as recipes, d as db } from '../../_/client.mjs';
import { r as requireAuth } from '../../_/require-auth.mjs';
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

const index_get = defineEventHandler(async (event) => {
  const user = requireAuth(event);
  const query = getQuery(event);
  const category = typeof query.category === "string" ? query.category.trim() : void 0;
  const conditions = [eq(recipes.userId, user.id)];
  if (category && category.length > 0) {
    conditions.push(eq(recipes.category, category));
  }
  const rows = await db.select({
    id: recipes.id,
    userId: recipes.userId,
    name: recipes.name,
    description: recipes.description,
    category: recipes.category,
    imageRelativePath: recipes.imageRelativePath,
    servings: recipes.servings,
    isVegan: recipes.isVegan,
    createdAt: recipes.createdAt,
    updatedAt: recipes.updatedAt
  }).from(recipes).where(and(...conditions)).orderBy(asc(recipes.name));
  return rows;
});

export { index_get as default };
//# sourceMappingURL=index2.get.mjs.map
