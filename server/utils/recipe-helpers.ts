import { and, asc, eq } from 'drizzle-orm';
import { db, schema } from '../db/client';
import { createNotFoundError } from './errors';
import {
  mapIngredient,
  toNumber,
  type IngredientDto,
} from './recipe-validation';
import { computeRecipeMacros, type Macros } from './macros';

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers for the recipe CRUD endpoints (T03).
//
// These helpers centralize the recipe-with-ingredients fetch + macro
// computation so every `[id]` handler returns an identical response shape and
// applies the same ownership-scoped lookup (404 when the recipe does not exist
// OR does not belong to the authenticated user — the two cases are
// intentionally indistinguishable to avoid leaking other users' resource
// existence).
// ─────────────────────────────────────────────────────────────────────────────

/** A recipe line item as returned in the API response. */
export interface RecipeIngredientDto {
  id: string;
  ingredientId: string;
  quantity: number;
  unit: string;
  position: number;
  ingredient: IngredientDto;
}

/** Full recipe detail as returned by GET /api/recipes/[id] and POST/PUT. */
export interface RecipeDto {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  prepSteps: string | null;
  category: string | null;
  imageRelativePath: string | null;
  servings: number;
  isVegan: boolean;
  createdAt: Date;
  updatedAt: Date;
  ingredients: RecipeIngredientDto[];
  macros: Macros;
}

/**
 * Load a recipe row scoped to the authenticated user.
 *
 * Returns the raw `recipes` row or throws a 404 when the recipe does not exist
 * or does not belong to the user. The two cases are indistinguishable to avoid
 * leaking other users' resource existence.
 */
export async function loadOwnedRecipe(
  recipeId: string,
  userId: string,
) {
  const [recipe] = await db
    .select()
    .from(schema.recipes)
    .where(and(eq(schema.recipes.id, recipeId), eq(schema.recipes.userId, userId)))
    .limit(1);

  if (!recipe) {
    throw createNotFoundError('Recipe not found');
  }
  return recipe;
}

/**
 * Fetch a recipe with its linked ingredients (full ingredient data) and
 * compute its macros. Returns the full RecipeDto response shape.
 *
 * The recipe must already have been verified as owned by the user
 * (`loadOwnedRecipe`). This helper does the join + macro computation.
 */
export async function buildRecipeDto(recipeId: string): Promise<RecipeDto> {
  // Fetch the recipe row.
  const [recipe] = await db
    .select()
    .from(schema.recipes)
    .where(eq(schema.recipes.id, recipeId))
    .limit(1);

  if (!recipe) {
    throw createNotFoundError('Recipe not found');
  }

  // Fetch the linked line items joined with their full ingredient data.
  const rows = await db
    .select({
      ri: schema.recipeIngredients,
      ingredient: schema.ingredients,
    })
    .from(schema.recipeIngredients)
    .innerJoin(
      schema.ingredients,
      eq(schema.recipeIngredients.ingredientId, schema.ingredients.id),
    )
    .where(eq(schema.recipeIngredients.recipeId, recipeId))
    .orderBy(asc(schema.recipeIngredients.position));

  const lineItems: RecipeIngredientDto[] = rows.map(({ ri, ingredient }) => ({
    id: ri.id,
    ingredientId: ri.ingredientId,
    quantity: toNumber(ri.quantity),
    unit: ri.unit,
    position: ri.position,
    ingredient: mapIngredient(ingredient),
  }));

  // Compute macros from the numeric ingredient values + gram quantities.
  const macros = computeRecipeMacros(
    lineItems.map((li) => ({
      ingredient: {
        kcalPer100g: li.ingredient.kcalPer100g,
        proteinPer100g: li.ingredient.proteinPer100g,
        fatPer100g: li.ingredient.fatPer100g,
        carbsPer100g: li.ingredient.carbsPer100g,
      },
      quantity: li.quantity,
    })),
  );

  return {
    id: recipe.id,
    userId: recipe.userId,
    name: recipe.name,
    description: recipe.description,
    prepSteps: recipe.prepSteps,
    category: recipe.category,
    imageRelativePath: recipe.imageRelativePath,
    servings: recipe.servings,
    isVegan: recipe.isVegan,
    createdAt: recipe.createdAt,
    updatedAt: recipe.updatedAt,
    ingredients: lineItems,
    macros,
  };
}

/**
 * Validate that every ingredient referenced in a recipe create/update payload
 * belongs to the authenticated user, and that all referenced IDs exist.
 *
 * Throws a structured 400 validation error listing the offending IDs when one
 * or more ingredients are missing or belong to another user. Returns the
 * found ingredient rows (keyed by id) for the handler to insert.
 */
export async function assertIngredientsOwned(
  ingredientIds: string[],
  userId: string,
) {
  const uniqueIds = Array.from(new Set(ingredientIds));
  if (uniqueIds.length === 0) return new Map();

  const found = await db
    .select()
    .from(schema.ingredients)
    .where(eq(schema.ingredients.userId, userId));

  const foundById = new Map(found.map((row) => [row.id, row] as const));

  const missing = uniqueIds.filter((id) => !foundById.has(id));
  if (missing.length > 0) {
    // Build a field-level error keyed by the first missing ingredient path so
    // the client can map it back to the right form row.
    const fieldErrors: Record<string, string[]> = {};
    for (const id of missing) {
      const key = `ingredients.${id}`;
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push('Ingredient not found or does not belong to you');
    }
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: {
        statusCode: 400,
        message: 'One or more ingredients are invalid',
        errors: fieldErrors,
      },
    });
  }

  return foundById;
}