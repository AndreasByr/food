import { d as defineEventHandler, j as getRequestHeader, r as readMultipartFormData, c as setResponseStatus } from '../../nitro/nitro.mjs';
import { d as db, a as recipes, b as recipeIngredients } from '../../_/client.mjs';
import { r as requireAuth } from '../../_/require-auth.mjs';
import { v as validateBody } from '../../_/validation.mjs';
import { a as createRecipeSchema } from '../../_/recipe-validation.mjs';
import { a as assertIngredientsOwned, b as buildRecipeDto } from '../../_/recipe-helpers.mjs';
import { s as saveRecipeImage } from '../../_/image-upload.mjs';
import { b as createValidationError } from '../../_/errors.mjs';
import { z } from 'zod';
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
import 'drizzle-orm';
import 'drizzle-orm/pg-core';
import 'drizzle-zod';
import 'node:fs/promises';

const INVALID_JSON = /* @__PURE__ */ Symbol("invalid-json");
const index_post = defineEventHandler(async (event) => {
  var _a;
  const user = requireAuth(event);
  const contentType = (_a = getRequestHeader(event, "content-type")) != null ? _a : "";
  let parsed;
  let image = void 0;
  if (contentType.toLowerCase().startsWith("multipart/form-data")) {
    const parts = await readMultipartFormData(event);
    const recipeRaw = parts && parts.length > 0 ? extractRecipeJsonPart(parts) : void 0;
    image = parts && parts.length > 0 ? extractImage(parts) : void 0;
    parsed = validateRecipePayload(recipeRaw, createRecipeSchema);
  } else {
    parsed = await validateBody(event, createRecipeSchema);
  }
  const ingredientIds = parsed.ingredients.map((ri) => ri.ingredientId);
  await assertIngredientsOwned(ingredientIds, user.id);
  let imageRelativePath = null;
  if (image) {
    const saved = await saveRecipeImage(image);
    imageRelativePath = saved.relativePath;
  }
  const lines = parsed.ingredients.map((ri, idx) => {
    var _a2;
    return {
      ingredientId: ri.ingredientId,
      quantity: String(ri.quantity),
      unit: ri.unit,
      position: (_a2 = ri.position) != null ? _a2 : idx
    };
  });
  const created = await db.transaction(async (tx) => {
    const [recipe] = await tx.insert(recipes).values({
      userId: user.id,
      name: parsed.name,
      description: parsed.description,
      prepSteps: parsed.prepSteps,
      category: parsed.category,
      servings: parsed.servings,
      isVegan: parsed.isVegan,
      imageRelativePath
    }).returning();
    await tx.insert(recipeIngredients).values(
      lines.map((line) => ({
        recipeId: recipe.id,
        ingredientId: line.ingredientId,
        quantity: line.quantity,
        unit: line.unit,
        position: line.position
      }))
    );
    return recipe;
  });
  setResponseStatus(event, 201);
  return buildRecipeDto(created.id);
});
function extractRecipeJsonPart(parts) {
  const recipePart = parts.find((p) => p.name === "recipe");
  if (!recipePart) return void 0;
  const text = recipePart.data.toString("utf8").trim();
  if (text.length === 0) return void 0;
  try {
    return JSON.parse(text);
  } catch {
    return INVALID_JSON;
  }
}
function extractImage(parts) {
  const imagePart = parts.find((p) => p.name === "image");
  if (!imagePart) return void 0;
  return {
    data: imagePart.data,
    filename: imagePart.filename,
    type: imagePart.type
  };
}
function validateRecipePayload(raw, schema2) {
  if (raw === INVALID_JSON) {
    throw createValidationError(
      new z.ZodError([
        { code: "custom", path: ["recipe"], message: "Recipe part must be valid JSON" }
      ]),
      "Invalid recipe JSON in multipart form"
    );
  }
  if (raw === void 0) {
    throw createValidationError(
      new z.ZodError([
        { code: "custom", path: ["recipe"], message: 'Multipart form must include a "recipe" part' }
      ]),
      "Missing recipe part"
    );
  }
  const result = schema2.safeParse(raw);
  if (!result.success) {
    throw createValidationError(result.error);
  }
  return result.data;
}

export { index_post as default };
//# sourceMappingURL=index2.post.mjs.map
