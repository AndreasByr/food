import { eq } from 'drizzle-orm';
import { db, schema } from '../../db/client';
import { requireAuth } from '../../utils/require-auth';
import { loadOwnedRecipe } from '../../utils/recipe-helpers';
import { removeRecipeImage } from '../../utils/image-upload';

/**
 * DELETE /api/recipes/[id] — delete a recipe, cascade its line items, and
 * remove the stored image file.
 *
 * Response 204: empty body on success.
 * Errors: 401 (no token), 404 (recipe does not exist OR does not belong to user).
 *
 * The `recipe_ingredients.recipe_id` FK is ON DELETE CASCADE, so the line items
 * are removed by Postgres. The image file is deleted *after* the row is gone
 * so a failed DB delete (e.g. concurrent delete already ran) never leaves the
 * row pointing at a missing file. Image removal is best-effort and idempotent:
 * a missing or out-of-band-removed file never turns a successful delete into a
 * 500.
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event);
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: { statusCode: 400, message: 'Recipe id is required' },
    });
  }

  // Verify ownership (404 when missing or not owned). loadOwnedRecipe returns
  // the row so we can read the image path before deleting.
  const recipe = await loadOwnedRecipe(id, user.id);

  await db.delete(schema.recipes).where(eq(schema.recipes.id, id));

  // Best-effort cleanup — never block a successful recipe delete on the image.
  if (recipe.imageRelativePath) {
    await removeRecipeImage(recipe.imageRelativePath);
  }

  setResponseStatus(event, 204);
  return null;
});