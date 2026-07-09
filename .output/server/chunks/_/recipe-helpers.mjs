import { e as createError } from '../nitro/nitro.mjs';
import { and, eq, asc } from 'drizzle-orm';
import { d as db, a as recipes, i as ingredients, b as recipeIngredients } from './client.mjs';
import { d as createNotFoundError } from './errors.mjs';
import { m as mapIngredient, t as toNumber } from './recipe-validation.mjs';

const ZERO_MACROS = {
  kcal: 0,
  protein: 0,
  fat: 0,
  carbs: 0
};
function round1(value) {
  return Math.round((value + Number.EPSILON) * 10) / 10;
}
function lineItemMacros(line) {
  assertGrams(line.quantity);
  const factor = line.quantity / 100;
  const { ingredient } = line;
  return {
    kcal: ingredient.kcalPer100g * factor,
    protein: ingredient.proteinPer100g * factor,
    fat: ingredient.fatPer100g * factor,
    carbs: ingredient.carbsPer100g * factor
  };
}
function computeRecipeMacros(lines) {
  if (lines.length === 0) return { ...ZERO_MACROS };
  let kcal = 0;
  let protein = 0;
  let fat = 0;
  let carbs = 0;
  for (const line of lines) {
    const scaled = lineItemMacros(line);
    kcal += scaled.kcal;
    protein += scaled.protein;
    fat += scaled.fat;
    carbs += scaled.carbs;
  }
  return {
    kcal: round1(kcal),
    protein: round1(protein),
    fat: round1(fat),
    carbs: round1(carbs)
  };
}
function assertGrams(quantity) {
  if (typeof quantity !== "number" || !Number.isFinite(quantity)) {
    throw new TypeError(`quantity must be a finite number, got: ${String(quantity)}`);
  }
  if (quantity < 0) {
    throw new RangeError(`quantity must be non-negative (grams), got: ${quantity}`);
  }
}

async function loadOwnedRecipe(recipeId, userId) {
  const [recipe] = await db.select().from(recipes).where(and(eq(recipes.id, recipeId), eq(recipes.userId, userId))).limit(1);
  if (!recipe) {
    throw createNotFoundError("Recipe not found");
  }
  return recipe;
}
async function buildRecipeDto(recipeId) {
  const [recipe] = await db.select().from(recipes).where(eq(recipes.id, recipeId)).limit(1);
  if (!recipe) {
    throw createNotFoundError("Recipe not found");
  }
  const rows = await db.select({
    ri: recipeIngredients,
    ingredient: ingredients
  }).from(recipeIngredients).innerJoin(
    ingredients,
    eq(recipeIngredients.ingredientId, ingredients.id)
  ).where(eq(recipeIngredients.recipeId, recipeId)).orderBy(asc(recipeIngredients.position));
  const lineItems = rows.map(({ ri, ingredient }) => ({
    id: ri.id,
    ingredientId: ri.ingredientId,
    quantity: toNumber(ri.quantity),
    unit: ri.unit,
    position: ri.position,
    ingredient: mapIngredient(ingredient)
  }));
  const macros = computeRecipeMacros(
    lineItems.map((li) => ({
      ingredient: {
        kcalPer100g: li.ingredient.kcalPer100g,
        proteinPer100g: li.ingredient.proteinPer100g,
        fatPer100g: li.ingredient.fatPer100g,
        carbsPer100g: li.ingredient.carbsPer100g
      },
      quantity: li.quantity
    }))
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
    macros
  };
}
async function assertIngredientsOwned(ingredientIds, userId) {
  const uniqueIds = Array.from(new Set(ingredientIds));
  if (uniqueIds.length === 0) return /* @__PURE__ */ new Map();
  const found = await db.select().from(ingredients).where(eq(ingredients.userId, userId));
  const foundById = new Map(found.map((row) => [row.id, row]));
  const missing = uniqueIds.filter((id) => !foundById.has(id));
  if (missing.length > 0) {
    const fieldErrors = {};
    for (const id of missing) {
      const key = `ingredients.${id}`;
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push("Ingredient not found or does not belong to you");
    }
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      data: {
        statusCode: 400,
        message: "One or more ingredients are invalid",
        errors: fieldErrors
      }
    });
  }
  return foundById;
}

export { assertIngredientsOwned as a, buildRecipeDto as b, loadOwnedRecipe as l };
//# sourceMappingURL=recipe-helpers.mjs.map
