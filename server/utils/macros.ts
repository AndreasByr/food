// ─────────────────────────────────────────────────────────────────────────────
// Macro calculation service (R003 — deterministic, zero AI involvement)
//
// A pure function: given recipe line items (ingredient per-100g macro values
// and a quantity in grams), it returns the summed macro totals for the whole
// recipe. No DB access, no I/O, no side effects — every recipe detail endpoint
// depends on this core.
//
// The Atwater general factors are 4 kcal/g for protein, 4 kcal/g for carbs,
// and 9 kcal/g for fat. Ingredients store `kcal_per_100g` as the authoritative
// energy value (which is itself typically derived from Atwater factors at
// data-entry time). This service scales the stored per-100g values
// proportionally by quantity, and additionally exposes
// `atwaterKcalFromMacros` so callers/tests can cross-check that a stored
// kcal value is consistent with the Atwater breakdown.
//
// Quantities are expected in grams. Unit conversion to grams is the
// responsibility of the API boundary (the DB stores the original unit for
// display); the service only ever sees grams. This keeps the service pure and
// trivially testable.
// ─────────────────────────────────────────────────────────────────────────────

/** Per-100g macro values for a single ingredient (all numbers, not DB strings). */
export interface IngredientMacros {
  kcalPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbsPer100g: number;
}

/** A single recipe line item: an ingredient's macros plus its gram quantity. */
export interface MacroLineItem {
  ingredient: IngredientMacros;
  /** Quantity in grams. Must be a finite, non-negative number. */
  quantity: number;
}

/** Computed macro totals for a recipe (or a per-serving slice). */
export interface Macros {
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
}

/** Atwater general energy factors (kcal per gram). */
export const ATWATER_FACTORS = {
  protein: 4,
  carbs: 4,
  fat: 9,
} as const;

/** Zero-macro sentinel, returned for an empty ingredient list. */
export const ZERO_MACROS: Macros = {
  kcal: 0,
  protein: 0,
  fat: 0,
  carbs: 0,
};

/**
 * Round to exactly 1 decimal place using round-half-up to avoid binary float
 * drift (e.g. 0.1 + 0.2 → 0.3, not 0.30000000000000004).
 */
function round1(value: number): number {
  return Math.round((value + Number.EPSILON) * 10) / 10;
}

/**
 * Compute the Atwater-derived energy (kcal) from protein/fat/carbs in grams.
 *
 * protein * 4 + carbs * 4 + fat * 9. This is the deterministic cross-check that
 * a stored `kcal_per_100g` value is consistent with its macro breakdown.
 */
export function atwaterKcalFromMacros(macros: {
  protein: number;
  fat: number;
  carbs: number;
}): number {
  return (
    macros.protein * ATWATER_FACTORS.protein +
    macros.fat * ATWATER_FACTORS.fat +
    macros.carbs * ATWATER_FACTORS.carbs
  );
}

/**
 * Scale a single ingredient's per-100g macros by a gram quantity.
 *
 * @returns Macros for one line item (unrounded — rounding happens at the sum).
 */
export function lineItemMacros(line: MacroLineItem): Macros {
  assertGrams(line.quantity);
  const factor = line.quantity / 100;
  const { ingredient } = line;
  return {
    kcal: ingredient.kcalPer100g * factor,
    protein: ingredient.proteinPer100g * factor,
    fat: ingredient.fatPer100g * factor,
    carbs: ingredient.carbsPer100g * factor,
  };
}

/**
 * Sum macro totals across all recipe line items, rounded to 1 decimal place.
 *
 * Pure and deterministic: the same input always yields the same output. An
 * empty list returns all zeros.
 */
export function computeRecipeMacros(lines: readonly MacroLineItem[]): Macros {
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
    carbs: round1(carbs),
  };
}

/**
 * Divide a recipe's total macros by its servings count to get per-serving
 * macros. Rounds each value to 1 decimal place. Returns zeros for
 * non-positive servings (defensive — the DB enforces servings >= 1).
 */
export function perServing(total: Macros, servings: number): Macros {
  if (!Number.isFinite(servings) || servings <= 0) return { ...ZERO_MACROS };
  return {
    kcal: round1(total.kcal / servings),
    protein: round1(total.protein / servings),
    fat: round1(total.fat / servings),
    carbs: round1(total.carbs / servings),
  };
}

/**
 * Guard that a quantity is a finite, non-negative number in grams.
 * Throws a TypeError for invalid input so callers fail loudly rather than
 * silently producing NaN macros.
 */
function assertGrams(quantity: number): void {
  if (typeof quantity !== 'number' || !Number.isFinite(quantity)) {
    throw new TypeError(`quantity must be a finite number, got: ${String(quantity)}`);
  }
  if (quantity < 0) {
    throw new RangeError(`quantity must be non-negative (grams), got: ${quantity}`);
  }
}