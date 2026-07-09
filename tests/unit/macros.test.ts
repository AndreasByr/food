import { describe, it, expect } from 'vitest';
import {
  computeRecipeMacros,
  lineItemMacros,
  perServing,
  atwaterKcalFromMacros,
  ATWATER_FACTORS,
  ZERO_MACROS,
  type MacroLineItem,
  type IngredientMacros,
} from '../../server/utils/macros';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers — build line items concisely.
// ─────────────────────────────────────────────────────────────────────────────

function ingredient(
  kcal: number,
  protein: number,
  fat: number,
  carbs: number,
): IngredientMacros {
  return {
    kcalPer100g: kcal,
    proteinPer100g: protein,
    fatPer100g: fat,
    carbsPer100g: carbs,
  };
}

function line(ing: IngredientMacros, quantity: number): MacroLineItem {
  return { ingredient: ing, quantity };
}

// ─────────────────────────────────────────────────────────────────────────────
// Fixture ingredients with realistic per-100g values (USDA-style).
// ─────────────────────────────────────────────────────────────────────────────

const OATS = ingredient(379, 13.15, 6.52, 66.99); // rolled oats
const CHICKEN_BREAST = ingredient(165, 31, 3.6, 0); // cooked, no skin
const OLIVE_OIL = ingredient(884, 0, 100, 0); // pure fat
const RICE = ingredient(130, 2.69, 0.28, 28.17); // cooked white rice

// ─────────────────────────────────────────────────────────────────────────────
// computeRecipeMacros — the core pure function.
// ─────────────────────────────────────────────────────────────────────────────

describe('computeRecipeMacros', () => {
  it('returns all zeros for an empty ingredient list', () => {
    const result = computeRecipeMacros([]);
    expect(result).toEqual({ kcal: 0, protein: 0, fat: 0, carbs: 0 });
    // Returns a fresh object, not the shared sentinel.
    expect(result).not.toBe(ZERO_MACROS);
  });

  it('scales a single ingredient proportionally by quantity (100g → full value)', () => {
    const result = computeRecipeMacros([line(OATS, 100)]);
    expect(result).toEqual({ kcal: 379, protein: 13.2, fat: 6.5, carbs: 67 });
  });

  it('scales a single ingredient at 50g (half)', () => {
    const result = computeRecipeMacros([line(OATS, 50)]);
    expect(result).toEqual({ kcal: 189.5, protein: 6.6, fat: 3.3, carbs: 33.5 });
  });

  it('scales a single ingredient at 200g (double)', () => {
    const result = computeRecipeMacros([line(OATS, 200)]);
    expect(result).toEqual({ kcal: 758, protein: 26.3, fat: 13, carbs: 134 });
  });

  it('scales at 0g quantity to all zeros', () => {
    const result = computeRecipeMacros([line(OATS, 0)]);
    expect(result).toEqual({ kcal: 0, protein: 0, fat: 0, carbs: 0 });
  });

  it('sums multiple ingredients correctly', () => {
    // 100g oats + 100g chicken breast + 10g olive oil
    const result = computeRecipeMacros([
      line(OATS, 100),
      line(CHICKEN_BREAST, 100),
      line(OLIVE_OIL, 10),
    ]);
    // oats:   379, 13.15, 6.52, 66.99
    // chicken: 165, 31,    3.6,  0
    // oil*0.1: 88.4, 0,   10,    0
    // raw sum: 632.4, 44.15, 20.12, 66.99
    expect(result).toEqual({ kcal: 632.4, protein: 44.2, fat: 20.1, carbs: 67 });
  });

  it('rounds each macro independently to 1 decimal place', () => {
    // Construct values that need rounding in different directions.
    const ing = ingredient(100.005, 10.025, 5.015, 20.045);
    const result = computeRecipeMacros([line(ing, 100)]);
    // round-half-up with epsilon: 100.005→100, 10.025→10, 5.015→5, 20.045→20
    expect(result.kcal).toBe(100);
    expect(result.protein).toBe(10);
    expect(result.fat).toBe(5);
    expect(result.carbs).toBe(20);
  });

  it('is deterministic — same input yields identical output across calls', () => {
    const lines = [line(OATS, 75), line(CHICKEN_BREAST, 150), line(RICE, 200)];
    const a = computeRecipeMacros(lines);
    const b = computeRecipeMacros(lines);
    expect(a).toEqual(b);
  });

  it('handles fractional gram quantities', () => {
    const result = computeRecipeMacros([line(OATS, 33.5)]);
    // 379 * 0.335 = 126.965 → 127.0
    expect(result.kcal).toBe(127);
    expect(result.protein).toBe(4.4); // 13.15 * 0.335 = 4.40525 → 4.4
  });

  it('accumulates without float drift across many ingredients', () => {
    // 50 lines of 0.1g each of an ingredient with 100 kcal/100g.
    const tiny = line(ingredient(100, 0, 0, 0), 0.1);
    const lines = Array.from({ length: 50 }, () => tiny);
    const result = computeRecipeMacros(lines);
    // 50 * (100 * 0.001) = 50 * 0.1 = 5.0 — must be exactly 5, not 5.000000001
    expect(result.kcal).toBe(5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// lineItemMacros — single line scaling (unrounded).
// ─────────────────────────────────────────────────────────────────────────────

describe('lineItemMacros', () => {
  it('returns unrounded scaled values for a single line', () => {
    const result = lineItemMacros(line(OATS, 50));
    expect(result.kcal).toBeCloseTo(189.5, 10);
    expect(result.protein).toBeCloseTo(6.575, 10);
    expect(result.fat).toBeCloseTo(3.26, 10);
    expect(result.carbs).toBeCloseTo(33.495, 10);
  });

  it('at 100g returns the exact per-100g values', () => {
    const result = lineItemMacros(line(CHICKEN_BREAST, 100));
    expect(result).toEqual({ kcal: 165, protein: 31, fat: 3.6, carbs: 0 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// perServing — dividing totals by servings count.
// ─────────────────────────────────────────────────────────────────────────────

describe('perServing', () => {
  const total = { kcal: 800, protein: 40, fat: 20, carbs: 100 };

  it('divides each macro by the servings count', () => {
    expect(perServing(total, 4)).toEqual({ kcal: 200, protein: 10, fat: 5, carbs: 25 });
  });

  it('handles servings = 1 (returns the same totals, rounded)', () => {
    expect(perServing(total, 1)).toEqual(total);
  });

  it('rounds each per-serving value to 1 decimal place', () => {
    const t = { kcal: 100, protein: 33, fat: 10, carbs: 7 };
    // 33 / 3 = 11, 10/3 = 3.333→3.3, 7/3 = 2.333→2.3, 100/3 = 33.333→33.3
    expect(perServing(t, 3)).toEqual({ kcal: 33.3, protein: 11, fat: 3.3, carbs: 2.3 });
  });

  it('returns zeros for non-positive servings (defensive)', () => {
    expect(perServing(total, 0)).toEqual(ZERO_MACROS);
    expect(perServing(total, -2)).toEqual(ZERO_MACROS);
  });

  it('returns zeros for non-finite servings (defensive)', () => {
    expect(perServing(total, Number.NaN)).toEqual(ZERO_MACROS);
    expect(perServing(total, Number.POSITIVE_INFINITY)).toEqual(ZERO_MACROS);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// atwaterKcalFromMacros — deterministic Atwater energy cross-check.
// ─────────────────────────────────────────────────────────────────────────────

describe('atwaterKcalFromMacros', () => {
  it('computes kcal from macros using 4/4/9 factors', () => {
    // 10g protein * 4 + 5g fat * 9 + 20g carbs * 4 = 40 + 45 + 80 = 165
    expect(atwaterKcalFromMacros({ protein: 10, fat: 5, carbs: 20 })).toBe(165);
  });

  it('returns 0 for all-zero macros', () => {
    expect(atwaterKcalFromMacros({ protein: 0, fat: 0, carbs: 0 })).toBe(0);
  });

  it('matches the exported ATWATER_FACTORS constants', () => {
    expect(ATWATER_FACTORS.protein).toBe(4);
    expect(ATWATER_FACTORS.carbs).toBe(4);
    expect(ATWATER_FACTORS.fat).toBe(9);
  });

  it('is consistent with chicken breast (165 kcal ≈ 31*4 + 3.6*9 + 0*4)', () => {
    // 124 + 32.4 + 0 = 156.4 — chicken's 165 kcal includes water/mineral ash,
    // so Atwater is an approximation. We only assert the formula, not equality.
    expect(atwaterKcalFromMacros({ protein: 31, fat: 3.6, carbs: 0 })).toBeCloseTo(156.4, 5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Negative tests — invalid inputs must throw, never silently return NaN.
// ─────────────────────────────────────────────────────────────────────────────

describe('negative input handling', () => {
  it('throws TypeError for NaN quantity', () => {
    expect(() => computeRecipeMacros([line(OATS, Number.NaN)])).toThrow(TypeError);
  });

  it('throws TypeError for Infinity quantity', () => {
    expect(() => computeRecipeMacros([line(OATS, Number.POSITIVE_INFINITY)])).toThrow(
      TypeError,
    );
  });

  it('throws RangeError for negative quantity', () => {
    expect(() => computeRecipeMacros([line(OATS, -50)])).toThrow(RangeError);
  });

  it('throws TypeError for non-number quantity (string)', () => {
    // @ts-expect-error -- intentionally invalid runtime input
    expect(() => computeRecipeMacros([line(OATS, '100')])).toThrow(TypeError);
  });

  it('throws on the first invalid line, before summing others', () => {
    expect(() =>
      computeRecipeMacros([line(OATS, 100), line(CHICKEN_BREAST, -10)]),
    ).toThrow(RangeError);
  });

  it('does not throw when a valid list contains a zero quantity line', () => {
    expect(() => computeRecipeMacros([line(OATS, 100), line(CHICKEN_BREAST, 0)])).not.toThrow();
  });
});