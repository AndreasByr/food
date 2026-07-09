import { eq } from 'drizzle-orm';
import { asc } from 'drizzle-orm';
import { db, schema } from '../../db/client';
import { requireAuth } from '../../utils/require-auth';
import { mapIngredient } from '../../utils/recipe-validation';

/**
 * GET /api/ingredients — list the authenticated user's ingredients.
 *
 * Response 200: an array of ingredients with numeric macro fields, ordered by
 * name (case-insensitive) for a stable, alphabetical listing in the recipe form.
 * Errors: 401 (no token).
 *
 * Data isolation: the query is scoped to `user_id = user.id` so one user can
 * never see another user's ingredients. The `ingredients_user_id_idx` index
 * makes this an index scan.
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event);

  const rows = await db
    .select()
    .from(schema.ingredients)
    .where(eq(schema.ingredients.userId, user.id))
    .orderBy(asc(schema.ingredients.name));

  return rows.map(mapIngredient);
});