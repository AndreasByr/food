import { d as defineEventHandler, g as getRouterParam, e as createError, c as setResponseStatus } from '../../../nitro/nitro.mjs';
import { eq } from 'drizzle-orm';
import { d as db, a as recipes } from '../../../_/client.mjs';
import { r as requireAuth } from '../../../_/require-auth.mjs';
import { l as loadOwnedRecipe } from '../../../_/recipe-helpers.mjs';
import { r as removeRecipeImage } from '../../../_/image-upload.mjs';
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
import '../../../_/recipe-validation.mjs';
import 'zod';
import 'drizzle-zod';
import 'node:fs/promises';

const _id__delete = defineEventHandler(async (event) => {
  const user = requireAuth(event);
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      data: { statusCode: 400, message: "Recipe id is required" }
    });
  }
  const recipe = await loadOwnedRecipe(id, user.id);
  await db.delete(recipes).where(eq(recipes.id, id));
  if (recipe.imageRelativePath) {
    await removeRecipeImage(recipe.imageRelativePath);
  }
  setResponseStatus(event, 204);
  return null;
});

export { _id__delete as default };
//# sourceMappingURL=_id_.delete.mjs.map
