import { d as defineEventHandler, g as getRouterParam, e as createError } from '../../../nitro/nitro.mjs';
import { r as requireAuth } from '../../../_/require-auth.mjs';
import { l as loadOwnedRecipe, b as buildRecipeDto } from '../../../_/recipe-helpers.mjs';
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
import '../../../_/errors.mjs';
import 'drizzle-orm';
import '../../../_/client.mjs';
import 'drizzle-orm/postgres-js';
import 'postgres';
import 'drizzle-orm/pg-core';
import '../../../_/recipe-validation.mjs';
import 'zod';
import 'drizzle-zod';

const _id__get = defineEventHandler(async (event) => {
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
  return buildRecipeDto(id);
});

export { _id__get as default };
//# sourceMappingURL=_id_.get.mjs.map
