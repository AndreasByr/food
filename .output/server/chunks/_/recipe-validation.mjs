import { z } from 'zod';
import { createInsertSchema } from 'drizzle-zod';
import { i as ingredients, a as recipes } from './client.mjs';

function toNumber(value) {
  if (value == null) return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}
function mapIngredient(row) {
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
    updatedAt: row.updatedAt
  };
}
const ingredientInsertSchema = createInsertSchema(ingredients, {
  name: (s) => s.name.trim().min(1, "Name must not be empty").max(120, "Name too long"),
  // Optional — omitted means "use the DB default ('g')". drizzle-zod wraps this
  // in .optional(), so we must NOT chain .default() here (ZodOptional short-
  // circuits undefined before the inner default can fire). The DB column default
  // is the single source of truth for the fallback value.
  defaultUnit: (s) => s.defaultUnit.trim().min(1, "Unit must not be empty").max(20, "Unit too long"),
  // postgres.js returns numeric as string, but the API accepts JSON numbers.
  kcalPer100g: () => z.number().min(0, "kcal must be >= 0").max(1e5, "kcal too large"),
  proteinPer100g: () => z.number().min(0, "protein must be >= 0").max(1e5, "protein too large"),
  fatPer100g: () => z.number().min(0, "fat must be >= 0").max(1e5, "fat too large"),
  carbsPer100g: () => z.number().min(0, "carbs must be >= 0").max(1e5, "carbs too large")
});
const createIngredientSchema = ingredientInsertSchema.omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true
});
const recipeIngredientInputSchema = z.object({
  ingredientId: z.string().uuid("ingredientId must be a valid UUID"),
  quantity: z.number().positive("quantity must be > 0").max(1e5, "quantity too large"),
  unit: z.string().trim().min(1, "unit must not be empty").max(20, "unit too long"),
  position: z.number().int().min(0, "position must be >= 0").optional()
});
const recipeInsertSchema = createInsertSchema(recipes, {
  name: (s) => s.name.trim().min(1, "Name must not be empty").max(200, "Name too long"),
  description: (s) => s.description.max(2e3, "Description too long").optional(),
  prepSteps: (s) => s.prepSteps.max(5e3, "Preparation steps too long").optional(),
  category: (s) => s.category.trim().max(50, "Category too long").optional(),
  // Optional — omitted means "use the DB default (1)". See the defaultUnit note
  // above for why .default() is intentionally not chained here.
  servings: () => z.number().int().min(1, "servings must be >= 1").max(100, "servings too large"),
  isVegan: () => z.boolean()
});
const createRecipeSchema = recipeInsertSchema.omit({
  id: true,
  userId: true,
  imageRelativePath: true,
  createdAt: true,
  updatedAt: true
}).extend({
  ingredients: z.array(recipeIngredientInputSchema).min(1, "At least one ingredient is required").max(100, "Too many ingredients in one recipe")
});
const updateRecipeSchema = createRecipeSchema.partial();

export { createRecipeSchema as a, createIngredientSchema as c, mapIngredient as m, toNumber as t, updateRecipeSchema as u };
//# sourceMappingURL=recipe-validation.mjs.map
