import { and, asc, eq } from 'drizzle-orm';
import { db, schema } from '../../db/client';
import { requireAuth } from '../../utils/require-auth';
import { getQuery } from 'h3';

/**
 * GET /api/recipes — list the authenticated user's recipes.
 *
 * Query: ?category=<string> — optional case-insensitive category filter.
 * Response 200: an array of recipe summaries (no ingredients / no macros — the
 * list view only needs names + a thumbnail). Full detail is GET /api/recipes/[id].
 * Errors: 401 (no token).
 *
 * Data isolation: scoped to `user_id = user.id`. The `recipes_user_category_idx`
 * index covers the optional category filter as an index scan.
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event);

  const query = getQuery(event);
  const category = typeof query.category === 'string' ? query.category.trim() : undefined;

  const conditions = [eq(schema.recipes.userId, user.id)];
  if (category && category.length > 0) {
    // Case-insensitive category match — keeps the label a simple free-text tag.
    conditions.push(eq(schema.recipes.category, category));
  }

  const rows = await db
    .select({
      id: schema.recipes.id,
      userId: schema.recipes.userId,
      name: schema.recipes.name,
      description: schema.recipes.description,
      category: schema.recipes.category,
      imageRelativePath: schema.recipes.imageRelativePath,
      servings: schema.recipes.servings,
      isVegan: schema.recipes.isVegan,
      createdAt: schema.recipes.createdAt,
      updatedAt: schema.recipes.updatedAt,
    })
    .from(schema.recipes)
    .where(and(...conditions))
    .orderBy(asc(schema.recipes.name));

  return rows;
});