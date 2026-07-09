import { describe, it, expect } from 'vitest';
import {
  createIngredientSchema,
  createRecipeSchema,
  updateRecipeSchema,
  recipeIngredientInputSchema,
  toNumber,
} from '../../server/utils/recipe-validation';

// ─────────────────────────────────────────────────────────────────────────────
// Unit tests for the recipe-engine Zod schemas and the numeric-string mapper.
//
// These schemas are the input contract for every recipe/ingredient endpoint.
// They are pure functions (no DB, no Nitro) so they are exhaustively testable
// without a running Postgres — including all the negative paths the API must
// reject with a 400.
// ─────────────────────────────────────────────────────────────────────────────

const validIngredient = {
  name: 'Rolled Oats',
  kcalPer100g: 379,
  proteinPer100g: 13.15,
  fatPer100g: 6.52,
  carbsPer100g: 66.99,
};

const validRecipeIngredient = {
  ingredientId: '11111111-1111-4111-8111-111111111111',
  quantity: 150,
  unit: 'g',
};

// ── toNumber (postgres numeric-string boundary) ─────────────────────────────

describe('toNumber', () => {
  it('parses numeric strings to numbers', () => {
    expect(toNumber('379')).toBe(379);
    expect(toNumber('13.15')).toBe(13.15);
  });

  it('passes numbers through unchanged', () => {
    expect(toNumber(379)).toBe(379);
    expect(toNumber(0)).toBe(0);
  });

  it('returns 0 for null/undefined instead of NaN', () => {
    expect(toNumber(null)).toBe(0);
    expect(toNumber(undefined)).toBe(0);
  });

  it('returns 0 for non-finite strings (defensive)', () => {
    expect(toNumber('not-a-number')).toBe(0);
    expect(toNumber('')).toBe(0);
  });
});

// ── createIngredientSchema ───────────────────────────────────────────────────

describe('createIngredientSchema', () => {
  it('accepts a fully valid ingredient', () => {
    const result = createIngredientSchema.safeParse(validIngredient);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Rolled Oats');
      expect(result.data.kcalPer100g).toBe(379);
    }
  });

  it('accepts an omitted defaultUnit (the DB defaults it to "g")', () => {
    const withoutUnit = {
      name: 'Rolled Oats',
      kcalPer100g: 379,
      proteinPer100g: 13.15,
      fatPer100g: 6.52,
      carbsPer100g: 66.99,
    };
    const result = createIngredientSchema.safeParse(withoutUnit);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.defaultUnit).toBeUndefined();
    }
  });

  it('trims the name and rejects an empty/whitespace name', () => {
    const blank = createIngredientSchema.safeParse({ ...validIngredient, name: '   ' });
    expect(blank.success).toBe(false);
    if (!blank.success) {
      expect(blank.error.issues.some((i) => i.path.includes('name'))).toBe(true);
    }
  });

  it('rejects negative macro values', () => {
    const neg = createIngredientSchema.safeParse({ ...validIngredient, kcalPer100g: -5 });
    expect(neg.success).toBe(false);
    if (!neg.success) {
      expect(neg.error.issues.some((i) => i.message.includes('kcal'))).toBe(true);
    }
  });

  it('rejects string values where numbers are required', () => {
    const str = createIngredientSchema.safeParse({ ...validIngredient, proteinPer100g: '13.15' });
    expect(str.success).toBe(false);
  });

  it('rejects a missing required macro field', () => {
    const { carbsPer100g, ...missing } = validIngredient;
    const result = createIngredientSchema.safeParse(missing);
    expect(result.success).toBe(false);
  });

  it('rejects names longer than 120 characters', () => {
    const result = createIngredientSchema.safeParse({ ...validIngredient, name: 'x'.repeat(121) });
    expect(result.success).toBe(false);
  });

  it('accepts a custom defaultUnit', () => {
    const result = createIngredientSchema.safeParse({ ...validIngredient, defaultUnit: 'ml' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.defaultUnit).toBe('ml');
  });

  it('strips server-managed fields (id/userId/timestamps) from the body', () => {
    const withId = {
      ...validIngredient,
      id: '11111111-1111-4111-8111-111111111111',
      userId: '22222222-2222-4222-8222-222222222222',
    };
    const result = createIngredientSchema.safeParse(withId);
    expect(result.success).toBe(true);
    if (result.success) {
      expect('id' in result.data).toBe(false);
      expect('userId' in result.data).toBe(false);
    }
  });
});

// ── recipeIngredientInputSchema ───────────────────────────────────────────────

describe('recipeIngredientInputSchema', () => {
  it('accepts a valid line item', () => {
    const result = recipeIngredientInputSchema.safeParse(validRecipeIngredient);
    expect(result.success).toBe(true);
  });

  it('rejects a non-UUID ingredientId', () => {
    const result = recipeIngredientInputSchema.safeParse({ ...validRecipeIngredient, ingredientId: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('rejects zero or negative quantity', () => {
    expect(recipeIngredientInputSchema.safeParse({ ...validRecipeIngredient, quantity: 0 }).success).toBe(false);
    expect(recipeIngredientInputSchema.safeParse({ ...validRecipeIngredient, quantity: -10 }).success).toBe(false);
  });

  it('rejects an empty unit', () => {
    const result = recipeIngredientInputSchema.safeParse({ ...validRecipeIngredient, unit: '' });
    expect(result.success).toBe(false);
  });

  it('accepts an optional position', () => {
    const withPos = recipeIngredientInputSchema.safeParse({ ...validRecipeIngredient, position: 2 });
    expect(withPos.success).toBe(true);
    const withoutPos = recipeIngredientInputSchema.safeParse(validRecipeIngredient);
    expect(withoutPos.success).toBe(true);
  });
});

// ── createRecipeSchema ───────────────────────────────────────────────────────

const validRecipe = {
  name: 'Overnight Oats',
  servings: 2,
  ingredients: [validRecipeIngredient],
};

describe('createRecipeSchema', () => {
  it('accepts a valid recipe with one ingredient', () => {
    const result = createRecipeSchema.safeParse(validRecipe);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.servings).toBe(2);
      expect(result.data.ingredients).toHaveLength(1);
    }
  });

  it('accepts an omitted servings (the DB defaults it to 1)', () => {
    const { servings: _omitted, ...withoutServings } = validRecipe;
    const result = createRecipeSchema.safeParse(withoutServings);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.servings).toBeUndefined();
      expect(result.data.isVegan).toBeUndefined();
    }
  });

  it('rejects a recipe with no ingredients', () => {
    const result = createRecipeSchema.safeParse({ ...validRecipe, ingredients: [] });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => /at least one ingredient/i.test(i.message))).toBe(true);
    }
  });

  it('rejects servings below 1', () => {
    const result = createRecipeSchema.safeParse({ ...validRecipe, servings: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects an empty name', () => {
    const result = createRecipeSchema.safeParse({ ...validRecipe, name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a description longer than 2000 characters', () => {
    const result = createRecipeSchema.safeParse({ ...validRecipe, description: 'x'.repeat(2001) });
    expect(result.success).toBe(false);
  });

  it('accepts optional fields being omitted', () => {
    const result = createRecipeSchema.safeParse({
      name: 'Plain Recipe',
      servings: 1,
      ingredients: [validRecipeIngredient],
    });
    expect(result.success).toBe(true);
  });
});

// ── updateRecipeSchema (partial) ─────────────────────────────────────────────

describe('updateRecipeSchema', () => {
  it('accepts an empty object (no-op update)', () => {
    const result = updateRecipeSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts a single-field update (name only)', () => {
    const result = updateRecipeSchema.safeParse({ name: 'Renamed' });
    expect(result.success).toBe(true);
  });

  it('accepts updating ingredients only', () => {
    const result = updateRecipeSchema.safeParse({ ingredients: [validRecipeIngredient] });
    expect(result.success).toBe(true);
  });

  it('still validates field formats on partial input', () => {
    expect(updateRecipeSchema.safeParse({ servings: 0 }).success).toBe(false);
    expect(updateRecipeSchema.safeParse({ name: '' }).success).toBe(false);
  });
});