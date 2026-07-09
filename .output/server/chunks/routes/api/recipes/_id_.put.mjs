import { d as defineEventHandler, g as getRouterParam, e as createError } from '../../../nitro/nitro.mjs';
import { eq } from 'drizzle-orm';
import { d as db, a as recipes, b as recipeIngredients } from '../../../_/client.mjs';
import { r as requireAuth } from '../../../_/require-auth.mjs';
import { v as validateBody } from '../../../_/validation.mjs';
import { u as updateRecipeSchema } from '../../../_/recipe-validation.mjs';
import { l as loadOwnedRecipe, a as assertIngredientsOwned, b as buildRecipeDto } from '../../../_/recipe-helpers.mjs';
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
import 'zod';
import 'drizzle-zod';

const _id__put = defineEventHandler(async (event) => {
  const user = requireAuth(event);
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      data: { statusCode: 400, message: "Recipe id is required" }
    });
  }
  await loadOwnedRecipe(id, user.id);
  const body = await validateBody(event, updateRecipeSchema);
  let ingredientLines;
  if (body.ingredients !== void 0) {
    const ingredientIds = body.ingredients.map((ri) => ri.ingredientId);
    await assertIngredientsOwned(ingredientIds, user.id);
    ingredientLines = body.ingredients.map((ri, idx) => {
      var _a;
      return {
        ingredientId: ri.ingredientId,
        quantity: String(ri.quantity),
        unit: ri.unit,
        position: (_a = ri.position) != null ? _a : idx
      };
    });
  }
  await db.transaction(async (tx) => {
    const updates = { updatedAt: /* @__PURE__ */ new Date() };
    if (body.name !== void 0) updates.name = body.name;
    if (body.description !== void 0) updates.description = body.description;
    if (body.prepSteps !== void 0) updates.prepSteps = body.prepSteps;
    if (body.category !== void 0) updates.category = body.category;
    if (body.servings !== void 0) updates.servings = body.servings;
    if (body.isVegan !== void 0) updates.isVegan = body.isVegan;
    await tx.update(recipes).set(updates).where(eq(recipes.id, id));
    if (ingredientLines !== void 0) {
      await tx.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, id));
      if (ingredientLines.length > 0) {
        await tx.insert(recipeIngredients).values(
          ingredientLines.map((line) => ({
            recipeId: id,
            ingredientId: line.ingredientId,
            quantity: line.quantity,
            unit: line.unit,
            position: line.position
          }))
        );
      }
    }
  });
  return buildRecipeDto(id);
});

export { _id__put as default };
//# sourceMappingURL=_id_.put.mjs.map
