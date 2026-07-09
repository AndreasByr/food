import { d as defineEventHandler, c as setResponseStatus } from '../../nitro/nitro.mjs';
import { and, eq, sql } from 'drizzle-orm';
import { d as db, i as ingredients } from '../../_/client.mjs';
import { r as requireAuth } from '../../_/require-auth.mjs';
import { v as validateBody } from '../../_/validation.mjs';
import { a as createConflictError } from '../../_/errors.mjs';
import { m as mapIngredient, c as createIngredientSchema } from '../../_/recipe-validation.mjs';
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
import 'drizzle-zod';

const index_post = defineEventHandler(async (event) => {
  const user = requireAuth(event);
  const body = await validateBody(event, createIngredientSchema);
  const existing = await db.select({ id: ingredients.id }).from(ingredients).where(
    and(
      eq(ingredients.userId, user.id),
      sql`lower(${ingredients.name}) = lower(${body.name})`
    )
  ).limit(1);
  if (existing.length > 0) {
    throw createConflictError("An ingredient with this name already exists");
  }
  let row;
  try {
    [row] = await db.insert(ingredients).values({
      userId: user.id,
      name: body.name,
      defaultUnit: body.defaultUnit,
      kcalPer100g: String(body.kcalPer100g),
      proteinPer100g: String(body.proteinPer100g),
      fatPer100g: String(body.fatPer100g),
      carbsPer100g: String(body.carbsPer100g)
    }).returning();
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === "23505") {
      throw createConflictError("An ingredient with this name already exists");
    }
    throw err;
  }
  setResponseStatus(event, 201);
  return mapIngredient(row);
});

export { index_post as default };
//# sourceMappingURL=index.post.mjs.map
