import { and, eq, sql } from 'drizzle-orm';
import { db, schema } from '../../db/client';
import { requireAuth } from '../../utils/require-auth';
import { validateBody } from '../../utils/validation';
import { createConflictError, createAuthError } from '../../utils/errors';
import {
  createIngredientSchema,
  mapIngredient,
  type CreateIngredientInput,
} from '../../utils/recipe-validation';

/**
 * POST /api/ingredients — create an ingredient scoped to the authenticated
 * user.
 *
 * Body (JSON): { name, defaultUnit?, kcalPer100g, proteinPer100g, fatPer100g, carbsPer100g }
 * Response 201: the created ingredient with numeric macro fields.
 * Errors: 401 (no token), 400 (validation), 409 (duplicate name for this user).
 *
 * Ingredient names are unique per user, case-insensitive — enforced by the
 * `ingredients_user_lower_name_unique` index. A pre-check query gives a clean
 * 409 message; a caught unique-violation (code 23505) guards the TOCTOU race.
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event);
  const body = await validateBody(event, createIngredientSchema) as CreateIngredientInput;

  // Pre-check for a duplicate name (case-insensitive, scoped to this user).
  const existing = await db
    .select({ id: schema.ingredients.id })
    .from(schema.ingredients)
    .where(
      and(
        eq(schema.ingredients.userId, user.id),
        sql`lower(${schema.ingredients.name}) = lower(${body.name})`,
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    throw createConflictError('An ingredient with this name already exists');
  }

  let row;
  try {
    [row] = await db
      .insert(schema.ingredients)
      .values({
        userId: user.id,
        name: body.name,
        defaultUnit: body.defaultUnit,
        kcalPer100g: String(body.kcalPer100g),
        proteinPer100g: String(body.proteinPer100g),
        fatPer100g: String(body.fatPer100g),
        carbsPer100g: String(body.carbsPer100g),
      })
      .returning();
  } catch (err) {
    // Postgres unique-violation (code 23505) — two concurrent inserts raced
    // past the pre-check. Surface it as a clean 409 rather than a raw DB error.
    if (err && typeof err === 'object' && 'code' in err && err.code === '23505') {
      throw createConflictError('An ingredient with this name already exists');
    }
    throw err;
  }

  if (!row) {
    throw createAuthError('Failed to create ingredient');
  }

  setResponseStatus(event, 201);
  return mapIngredient(row);
});
