import { z } from 'zod';
import { createInsertSchema } from 'drizzle-zod';
import * as schema from '../db/schema';

// ─────────────────────────────────────────────────────────────────────────────
// Zod validation schemas for the recipe engine (ingredients + recipes).
//
// Built on drizzle-zod's `createInsertSchema` so the column types come from the
// single source of truth (`server/db/schema.ts`). Numeric columns are overridden
// to `z.number()` — postgres.js returns them as strings on read, but the API
// accepts JSON numbers on write and the macro service (T01) consumes numbers.
//
// Schemas are pure Zod objects — importable on both server and client so S03
// can reuse them for form validation without duplicating rules.
// ─────────────────────────────────────────────────────────────────────────────

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Coerce a postgres.js numeric-string column value to a number at the DB
 * boundary. The macro service (T01) is a pure function that only accepts
 * numbers; this keeps it free of string-parsing concerns.
 *
 * Returns 0 for null/undefined so a missing value never produces NaN downstream.
 */
export function toNumber(value: string | number | null | undefined): number {
  if (value == null) return 0;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Map a raw `ingredients` row (numeric columns as strings) to one with numeric
 * macro fields. Used by every endpoint that returns ingredient data and by the
 * recipe detail endpoint (T03) before handing values to the macro service.
 */
export interface IngredientDto {
  id: string;
  userId: string;
  name: string;
  defaultUnit: string;
  kcalPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbsPer100g: number;
  createdAt: Date;
  updatedAt: Date;
}

export function mapIngredient(row: {
  id: string;
  userId: string;
  name: string;
  defaultUnit: string;
  kcalPer100g: string | number;
  proteinPer100g: string | number;
  fatPer100g: string | number;
  carbsPer100g: string | number;
  createdAt: Date;
  updatedAt: Date;
}): IngredientDto {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    defaultUnit: row.defaultUnit,
    kcalPer100g: toNumber(row.kcalPer100g),
    proteinPer100g: toNumber(row.proteinPer100g),
    fatPer100g: toNumber(row.fatPer100g),
    carbsPer100g: toNumber(row.carbsPer100g),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// ── Ingredient schemas ──────────────────────────────────────────────────────

const ingredientInsertSchema = createInsertSchema(schema.ingredients, {
  name: (s) => s.name.trim().min(1, 'Name must not be empty').max(120, 'Name too long'),
  // Optional — omitted means "use the DB default ('g')". drizzle-zod wraps this
  // in .optional(), so we must NOT chain .default() here (ZodOptional short-
  // circuits undefined before the inner default can fire). The DB column default
  // is the single source of truth for the fallback value.
  defaultUnit: (s) => s.defaultUnit.trim().min(1, 'Unit must not be empty').max(20, 'Unit too long'),
  // postgres.js returns numeric as string, but the API accepts JSON numbers.
  kcalPer100g: () => z.number().min(0, 'kcal must be >= 0').max(100000, 'kcal too large'),
  proteinPer100g: () => z.number().min(0, 'protein must be >= 0').max(100000, 'protein too large'),
  fatPer100g: () => z.number().min(0, 'fat must be >= 0').max(100000, 'fat too large'),
  carbsPer100g: () => z.number().min(0, 'carbs must be >= 0').max(100000, 'carbs too large'),
});

/**
 * Create-ingredient body. id/userId/timestamps come from the auth context and
 * DB defaults, never from the request body.
 */
export const createIngredientSchema = ingredientInsertSchema.omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateIngredientInput = z.infer<typeof createIngredientSchema>;

// ── Recipe-ingredient link schema ───────────────────────────────────────────

/**
 * One line item on a recipe: a reference to an existing ingredient plus a
 * quantity (in the given unit) and an optional display position.
 *
 * `position` is optional on input — the handler assigns sequential positions
 * (0, 1, 2, …) when omitted, preserving the array order the client sent.
 */
export const recipeIngredientInputSchema = z.object({
  ingredientId: z.string().uuid('ingredientId must be a valid UUID'),
  quantity: z.number().positive('quantity must be > 0').max(100000, 'quantity too large'),
  unit: z.string().trim().min(1, 'unit must not be empty').max(20, 'unit too long'),
  position: z.number().int().min(0, 'position must be >= 0').optional(),
});

export type RecipeIngredientInput = z.infer<typeof recipeIngredientInputSchema>;

// ── Recipe schemas ───────────────────────────────────────────────────────────

const recipeInsertSchema = createInsertSchema(schema.recipes, {
  name: (s) => s.name.trim().min(1, 'Name must not be empty').max(200, 'Name too long'),
  description: (s) => s.description.max(2000, 'Description too long').optional(),
  prepSteps: (s) => s.prepSteps.max(5000, 'Preparation steps too long').optional(),
  category: (s) => s.category.trim().max(50, 'Category too long').optional(),
  // Optional — omitted means "use the DB default (1)". See the defaultUnit note
  // above for why .default() is intentionally not chained here.
  servings: () => z.number().int().min(1, 'servings must be >= 1').max(100, 'servings too large'),
  isVegan: () => z.boolean(),
});

/**
 * Create-recipe body. id/userId/timestamps are server-managed; imageRelativePath
 * is set by the image-upload task (T04), not by this body.
 *
 * `ingredients` is required and non-empty — a recipe with no ingredients has no
 * macros and no meaning. Each ingredient must already exist (created via
 * /api/ingredients) and belong to the same user (enforced in the handler).
 */
export const createRecipeSchema = recipeInsertSchema
  .omit({
    id: true,
    userId: true,
    imageRelativePath: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    ingredients: z
      .array(recipeIngredientInputSchema)
      .min(1, 'At least one ingredient is required')
      .max(100, 'Too many ingredients in one recipe'),
  });

export type CreateRecipeInput = z.infer<typeof createRecipeSchema>;

/**
 * Update-recipe body. Every top-level field is optional (partial update).
 * Ingredients, when provided, fully replace the existing set. Omitting
 * `ingredients` keeps the current ingredient set untouched.
 */
export const updateRecipeSchema = createRecipeSchema.partial();

export type UpdateRecipeInput = z.infer<typeof updateRecipeSchema>;