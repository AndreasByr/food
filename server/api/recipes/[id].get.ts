import { db, schema } from '../../db/client';
import { requireAuth } from '../../utils/require-auth';
import { loadOwnedRecipe, buildRecipeDto } from '../../utils/recipe-helpers';

/**
 * GET /api/recipes/[id] — fetch a single recipe with ingredients + computed macros.
 *
 * Response 200: the full recipe (RecipeDto) including linked ingredients with
 * full macro data and the computed recipe-level macros { kcal, protein, fat, carbs }.
 * Errors: 401 (no token), 404 (recipe does not exist OR does not belong to user).
 *
 * Data isolation: the ownership check (`loadOwnedRecipe`) returns the same 404
 * for "not found" and "owned by someone else" so the existence of other users'
 * recipes is not leaked.
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

  // Verify ownership (404 when missing or not owned).
  await loadOwnedRecipe(id, user.id);

  // Build the full detail (join + macros). Uses the schema.db client.
  return buildRecipeDto(id);
});