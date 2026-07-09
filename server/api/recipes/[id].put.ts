import { eq } from 'drizzle-orm';
import { db, schema } from '../../db/client';
import { requireAuth } from '../../utils/require-auth';
import { validateBody } from '../../utils/validation';
import {
  updateRecipeSchema,
  type UpdateRecipeInput,
} from '../../utils/recipe-validation';
import {
  assertIngredientsOwned,
  loadOwnedRecipe,
  buildRecipeDto,
} from '../../utils/recipe-helpers';

/**
 * PUT /api/recipes/[id] — update recipe fields (partial update).
 *
 * Body (JSON): partial of the create body. When `ingredients` is provided it
 * fully replaces the existing ingredient set; omitting it keeps the current
 * set untouched. `imageRelativePath` is never writable here — image changes go
 * through the upload flow (T04).
 * Response 200: the updated full recipe with ingredients + macros.
 * Errors: 401 (no token), 400 (validation / unknown ingredient), 404 (not owned).
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

  // Verify ownership before validating the body — a 404 for a missing/foreign
  // recipe should take precedence over a 400 for a malformed body.
  await loadOwnedRecipe(id, user.id);

  const body = await validateBody(event, updateRecipeSchema) as UpdateRecipeInput;

  // If ingredients are being replaced, validate ownership of every referenced ID.
  let ingredientLines: { ingredientId: string; quantity: string; unit: string; position: number }[] | undefined;
  if (body.ingredients !== undefined) {
    const ingredientIds = body.ingredients.map((ri) => ri.ingredientId);
    await assertIngredientsOwned(ingredientIds, user.id);
    ingredientLines = body.ingredients.map((ri, idx) => ({
      ingredientId: ri.ingredientId,
      quantity: String(ri.quantity),
      unit: ri.unit,
      position: ri.position ?? idx,
    }));
  }

  await db.transaction(async (tx) => {
    // Update only the scalar recipe fields that were provided.
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.prepSteps !== undefined) updates.prepSteps = body.prepSteps;
    if (body.category !== undefined) updates.category = body.category;
    if (body.servings !== undefined) updates.servings = body.servings;
    if (body.isVegan !== undefined) updates.isVegan = body.isVegan;

    await tx
      .update(schema.recipes)
      .set(updates)
      .where(eq(schema.recipes.id, id));

    // Full-replace the ingredient set when provided.
    if (ingredientLines !== undefined) {
      await tx
        .delete(schema.recipeIngredients)
        .where(eq(schema.recipeIngredients.recipeId, id));

      if (ingredientLines.length > 0) {
        await tx.insert(schema.recipeIngredients).values(
          ingredientLines.map((line) => ({
            recipeId: id,
            ingredientId: line.ingredientId,
            quantity: line.quantity,
            unit: line.unit,
            position: line.position,
          })),
        );
      }
    }
  });

  return buildRecipeDto(id);
});