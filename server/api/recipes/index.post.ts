import { db, schema } from '../../db/client';
import { requireAuth } from '../../utils/require-auth';
import { validateBody } from '../../utils/validation';
import {
  createRecipeSchema,
  type CreateRecipeInput,
} from '../../utils/recipe-validation';
import {
  assertIngredientsOwned,
  buildRecipeDto,
} from '../../utils/recipe-helpers';
import { saveRecipeImage } from '../../utils/image-upload';
import { createValidationError } from '../../utils/errors';
import { z, type ZodType } from 'zod';

/** Sentinel marking a multipart `recipe` part that failed JSON.parse. */
const INVALID_JSON = Symbol('invalid-json');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/recipes — create a recipe scoped to the authenticated user.
//
// Accepts two content types:
//   1. application/json            — body is the recipe JSON (no image). This
//                                      is the path T02/T03/T05 and S03 use; it
//                                      stays fully supported so the core flow
//                                      is testable without multipart.
//   2. multipart/form-data         — parts:
//       • `recipe` (required, string) — the same recipe JSON
//       • `image`  (optional, file)   — jpeg/png/webp, max 5 MiB
//
// Response 201: the created recipe with linked ingredients, computed macros,
//               and `imageRelativePath` set when an image was uploaded.
// Errors: 401 (no token), 400 (validation / unknown ingredient / bad recipe JSON),
//         404 (ingredient not owned), 413 (image too large), 415 (bad image type).
//
// The recipe insert + recipe_ingredients inserts + image write run as a single
// DB transaction so a failure mid-way never leaves a half-built recipe. The
// image file is written *before* the commit so the DB row never points at a
// missing file; if the transaction throws, the orphaned file is left for an
// async reaper (rare path) rather than blocking the user's error response.
// ─────────────────────────────────────────────────────────────────────────────

export default defineEventHandler(async (event) => {
  const user = requireAuth(event);

  // Parse + validate the recipe body, dispatching on content type. The JSON
  // path reuses the existing `validateBody` helper (same structured 400 errors
  // S03/T05 already depend on); the multipart path validates the embedded
  // `recipe` JSON part against the same schema.
  const contentType = getRequestHeader(event, 'content-type') ?? '';
  let parsed: CreateRecipeInput;
  let image: ReturnType<typeof extractImage> = undefined;

  if (contentType.toLowerCase().startsWith('multipart/form-data')) {
    const parts = await readMultipartFormData(event);
    const recipeRaw = parts && parts.length > 0 ? extractRecipeJsonPart(parts) : undefined;
    image = parts && parts.length > 0 ? extractImage(parts) : undefined;
    parsed = validateRecipePayload(recipeRaw, createRecipeSchema) as CreateRecipeInput;
  } else {
    parsed = await validateBody(event, createRecipeSchema) as CreateRecipeInput;
  }

  // Verify every referenced ingredient exists and belongs to this user.
  const ingredientIds = parsed.ingredients.map((ri) => ri.ingredientId);
  await assertIngredientsOwned(ingredientIds, user.id);

  // Validate + persist the image (throws structured 400/413/415 on failure).
  // Done before the DB transaction so a bad image fails fast without opening
  // a tx. The file is written to disk here; the DB row gets its path below.
  let imageRelativePath: string | null = null;
  if (image) {
    const saved = await saveRecipeImage(image);
    imageRelativePath = saved.relativePath;
  }

  // Assign sequential positions when the client omits them, preserving array order.
  const lines = parsed.ingredients.map((ri, idx) => ({
    ingredientId: ri.ingredientId,
    quantity: String(ri.quantity),
    unit: ri.unit,
    position: ri.position ?? idx,
  }));

  const created = await db.transaction(async (tx) => {
    const [recipe] = await tx
      .insert(schema.recipes)
      .values({
        userId: user.id,
        name: parsed.name,
        description: parsed.description,
        prepSteps: parsed.prepSteps,
        category: parsed.category,
        servings: parsed.servings,
        isVegan: parsed.isVegan,
        imageRelativePath,
      })
      .returning();

    await tx.insert(schema.recipeIngredients).values(
      lines.map((line) => ({
        recipeId: recipe.id,
        ingredientId: line.ingredientId,
        quantity: line.quantity,
        unit: line.unit,
        position: line.position,
      })),
    );

    return recipe;
  });

  setResponseStatus(event, 201);
  return buildRecipeDto(created.id);
});

// ── Multipart body parsing ───────────────────────────────────────────────────

/** Element type of `readMultipartFormData`'s resolved array. */
type MultipartParts = NonNullable<Awaited<ReturnType<typeof readMultipartFormData>>>;

/** Pull the `recipe` JSON part out of a multipart list and JSON-parse it. */
function extractRecipeJsonPart(parts: MultipartParts): unknown {
  const recipePart = parts.find((p) => p.name === 'recipe');
  if (!recipePart) return undefined;
  const text = recipePart.data.toString('utf8').trim();
  if (text.length === 0) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    // Surface as a body-parse error during validation, not a 500.
    return INVALID_JSON;
  }
}

/** Pull the `image` file part out of a multipart list. */
function extractImage(parts: MultipartParts) {
  const imagePart = parts.find((p) => p.name === 'image');
  if (!imagePart) return undefined;
  return {
    data: imagePart.data,
    filename: imagePart.filename,
    type: imagePart.type,
  };
}

/**
 * Validate the multipart `recipe` part against a Zod schema, producing the
 * same structured 400 error shape as `validateBody` so multipart and JSON
 * paths share identical error responses.
 */
function validateRecipePayload<T extends ZodType>(
  raw: unknown,
  schema: T,
): z.infer<T> {
  if (raw === INVALID_JSON) {
    throw createValidationError(
      new z.ZodError([
        { code: 'custom', path: ['recipe'], message: 'Recipe part must be valid JSON' },
      ]),
      'Invalid recipe JSON in multipart form',
    );
  }
  if (raw === undefined) {
    throw createValidationError(
      new z.ZodError([
        { code: 'custom', path: ['recipe'], message: 'Multipart form must include a "recipe" part' },
      ]),
      'Missing recipe part',
    );
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw createValidationError(result.error);
  }
  return result.data;
}