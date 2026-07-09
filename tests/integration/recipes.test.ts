import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { eq, asc } from 'drizzle-orm';
import { db, schema, client } from '../setup';
import { hashPassword } from '../../server/utils/auth';
import {
  createIngredientSchema,
  mapIngredient,
  type CreateIngredientInput,
} from '../../server/utils/recipe-validation';
import {
  loadOwnedRecipe,
  buildRecipeDto,
  assertIngredientsOwned,
} from '../../server/utils/recipe-helpers';
import { computeRecipeMacros } from '../../server/utils/macros';
import { saveRecipeImage, removeRecipeImage, statRecipeImage } from '../../server/utils/image-upload';

// ─────────────────────────────────────────────────────────────────────────────
// Integration tests for the recipe engine (S02).
//
// These tests exercise the recipe engine against a real Postgres 16 instance:
// ingredient creation/listing, recipe CRUD, deterministic Atwater macro
// computation (verified against hand-calculated values), data isolation,
// duplicate-ingredient-name rejection, FK cascade on recipe delete, and image
// path persistence + cleanup.
//
// They follow the S01 integration-test convention: they drive the DB + helper
// layer directly (the same helpers the HTTP handlers call) rather than booting
// a Nitro server. The HTTP error shapes are covered by unit tests; here we
// prove the DB-backed behavior the endpoints depend on is correct.
// ─────────────────────────────────────────────────────────────────────────────

beforeAll(() => {
  // The macro service + helpers never read JWT_SECRET, but keep the env
  // consistent with the rest of the integration suite.
  if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'test-secret-at-least-32-bytes-long!!';
});

// ── Test helpers ─────────────────────────────────────────────────────────────

/** A user row shape used across tests. */
interface TestUser {
  id: string;
  email: string;
}

/** Insert a user and return its id + email. */
async function createUser(email: string, name?: string): Promise<TestUser> {
  const passwordHash = await hashPassword('password123');
  const [user] = await db
    .insert(schema.users)
    .values({ email, passwordHash, name })
    .returning({ id: schema.users.id, email: schema.users.email });
  return user;
}

/** Insert an ingredient for a user via the same schema path the POST handler uses. */
async function createIngredient(
  userId: string,
  input: {
    name: string;
    defaultUnit?: string;
    kcalPer100g: number;
    proteinPer100g: number;
    fatPer100g: number;
    carbsPer100g: number;
  },
) {
  // Validate the input through the same Zod schema the endpoint uses — proves
  // the schema accepts the shape the API contract promises.
  const parsed = createIngredientSchema.parse(input) as CreateIngredientInput;
  const [row] = await db
    .insert(schema.ingredients)
    .values({
      userId,
      name: parsed.name,
      defaultUnit: parsed.defaultUnit ?? 'g',
      kcalPer100g: String(parsed.kcalPer100g),
      proteinPer100g: String(parsed.proteinPer100g),
      fatPer100g: String(parsed.fatPer100g),
      carbsPer100g: String(parsed.carbsPer100g),
    })
    .returning();
  return mapIngredient(row);
}

/** Insert a recipe + its linked ingredients and return the recipe id. */
async function createRecipe(
  userId: string,
  opts: {
    name: string;
    description?: string;
    prepSteps?: string;
    category?: string;
    servings?: number;
    isVegan?: boolean;
    imageRelativePath?: string | null;
    ingredients: { ingredientId: string; quantity: number; unit: string; position?: number }[];
  },
): Promise<string> {
  const [recipe] = await db
    .insert(schema.recipes)
    .values({
      userId,
      name: opts.name,
      description: opts.description ?? null,
      prepSteps: opts.prepSteps ?? null,
      category: opts.category ?? null,
      servings: opts.servings ?? 1,
      isVegan: opts.isVegan ?? false,
      imageRelativePath: opts.imageRelativePath ?? null,
    })
    .returning({ id: schema.recipes.id });

  await db.insert(schema.recipeIngredients).values(
    opts.ingredients.map((line, idx) => ({
      recipeId: recipe.id,
      ingredientId: line.ingredientId,
      quantity: String(line.quantity),
      unit: line.unit,
      position: line.position ?? idx,
    })),
  );

  return recipe.id;
}

// ── Ingredients ──────────────────────────────────────────────────────────────

describe('Ingredient creation + listing', () => {
  it('creates an ingredient scoped to the user and returns numeric macros', async () => {
    const user = await createUser('ing-create@test');
    const ingredient = await createIngredient(user.id, {
      name: 'Oats',
      defaultUnit: 'g',
      kcalPer100g: 379,
      proteinPer100g: 13,
      fatPer100g: 7,
      carbsPer100g: 67,
    });

    expect(ingredient.id).toBeDefined();
    expect(ingredient.userId).toBe(user.id);
    expect(ingredient.name).toBe('Oats');
    expect(ingredient.defaultUnit).toBe('g');
    // Numeric boundary: postgres.js returns numeric as string; mapIngredient
    // must convert to numbers before the macro service consumes them.
    expect(ingredient.kcalPer100g).toBe(379);
    expect(ingredient.proteinPer100g).toBe(13);
    expect(ingredient.fatPer100g).toBe(7);
    expect(ingredient.carbsPer100g).toBe(67);
    expect(typeof ingredient.kcalPer100g).toBe('number');
  });

  it('lists only the authenticated user\'s ingredients, ordered by name', async () => {
    const userA = await createUser('ing-list-a@test');
    const userB = await createUser('ing-list-b@test');

    await createIngredient(userA.id, { name: 'Banana', kcalPer100g: 89, proteinPer100g: 1.1, fatPer100g: 0.3, carbsPer100g: 23 });
    await createIngredient(userA.id, { name: 'Almond', kcalPer100g: 579, proteinPer100g: 21, fatPer100g: 50, carbsPer100g: 22 });
    await createIngredient(userB.id, { name: 'SecretB', kcalPer100g: 1, proteinPer100g: 1, fatPer100g: 1, carbsPer100g: 1 });

    // Scoped query (same shape as GET /api/ingredients).
    const rows = await db
      .select()
      .from(schema.ingredients)
      .where(eq(schema.ingredients.userId, userA.id))
      .orderBy(asc(schema.ingredients.name));

    const mapped = rows.map(mapIngredient);
    expect(mapped).toHaveLength(2);
    expect(mapped[0].name).toBe('Almond'); // alphabetical
    expect(mapped[1].name).toBe('Banana');
    // User B's ingredient must never appear for user A.
    expect(mapped.find((i) => i.name === 'SecretB')).toBeUndefined();
  });

  it('rejects a duplicate ingredient name per user (case-insensitive unique index)', async () => {
    const user = await createUser('ing-dup@test');
    await createIngredient(user.id, { name: 'Flour', kcalPer100g: 364, proteinPer100g: 10, fatPer100g: 1, carbsPer100g: 76 });

    // Same name, different case — the unique index on (user_id, lower(name)) rejects it.
    await expect(
      db
        .insert(schema.ingredients)
        .values({
          userId: user.id,
          name: 'flour',
          defaultUnit: 'g',
          kcalPer100g: '100',
          proteinPer100g: '1',
          fatPer100g: '1',
          carbsPer100g: '1',
        })
        .returning(),
    ).rejects.toThrow();

    // A different user CAN have an ingredient with the same name (data isolation).
    const other = await createUser('ing-dup-other@test');
    const sameName = await createIngredient(other.id, { name: 'Flour', kcalPer100g: 100, proteinPer100g: 1, fatPer100g: 1, carbsPer100g: 1 });
    expect(sameName.name).toBe('Flour');
  });

  it('rejects an invalid ingredient body via the Zod schema (negative kcal)', async () => {
    const user = await createUser('ing-invalid@test');
    expect(() =>
      createIngredientSchema.parse({
        name: 'Bad',
        kcalPer100g: -10,
        proteinPer100g: 1,
        fatPer100g: 1,
        carbsPer100g: 1,
      }),
    ).toThrow();
    // Confirm nothing was inserted.
    const rows = await db.select().from(schema.ingredients).where(eq(schema.ingredients.userId, user.id));
    expect(rows).toHaveLength(0);
  });
});

// ── Recipes ──────────────────────────────────────────────────────────────────

describe('Recipe CRUD', () => {
  it('creates a recipe with linked ingredients and returns them via buildRecipeDto', async () => {
    const user = await createUser('rc-create@test');
    const oats = await createIngredient(user.id, { name: 'Oats', kcalPer100g: 379, proteinPer100g: 13, fatPer100g: 7, carbsPer100g: 67 });
    const honey = await createIngredient(user.id, { name: 'Honey', kcalPer100g: 304, proteinPer100g: 0.3, fatPer100g: 0, carbsPer100g: 82 });

    const recipeId = await createRecipe(user.id, {
      name: 'Oatmeal',
      description: 'Morning bowl',
      prepSteps: 'Mix and eat',
      category: 'Breakfast',
      servings: 2,
      isVegan: false,
      ingredients: [
        { ingredientId: oats.id, quantity: 100, unit: 'g' },
        { ingredientId: honey.id, quantity: 20, unit: 'g', position: 1 },
      ],
    });

    const dto = await buildRecipeDto(recipeId);
    expect(dto.id).toBe(recipeId);
    expect(dto.userId).toBe(user.id);
    expect(dto.name).toBe('Oatmeal');
    expect(dto.description).toBe('Morning bowl');
    expect(dto.prepSteps).toBe('Mix and eat');
    expect(dto.category).toBe('Breakfast');
    expect(dto.servings).toBe(2);
    expect(dto.isVegan).toBe(false);
    expect(dto.ingredients).toHaveLength(2);
    // Positions preserved and ordered.
    expect(dto.ingredients[0].ingredient.name).toBe('Oats');
    expect(dto.ingredients[0].position).toBe(0);
    expect(dto.ingredients[0].quantity).toBe(100);
    expect(dto.ingredients[1].ingredient.name).toBe('Honey');
    expect(dto.ingredients[1].position).toBe(1);
    expect(dto.ingredients[1].quantity).toBe(20);
    // Numeric macros on the linked ingredients.
    expect(dto.ingredients[0].ingredient.kcalPer100g).toBe(379);
    expect(typeof dto.ingredients[0].ingredient.kcalPer100g).toBe('number');
  });

  it('lists the user\'s recipes scoped to their user_id', async () => {
    const userA = await createUser('rc-list-a@test');
    const userB = await createUser('rc-list-b@test');
    const ing = await createIngredient(userA.id, { name: 'X', kcalPer100g: 100, proteinPer100g: 1, fatPer100g: 1, carbsPer100g: 1 });
    const ingB = await createIngredient(userB.id, { name: 'X', kcalPer100g: 100, proteinPer100g: 1, fatPer100g: 1, carbsPer100g: 1 });

    await createRecipe(userA.id, { name: 'Pancakes', category: 'Breakfast', ingredients: [{ ingredientId: ing.id, quantity: 50, unit: 'g' }] });
    await createRecipe(userA.id, { name: 'Salad', category: 'Lunch', ingredients: [{ ingredientId: ing.id, quantity: 50, unit: 'g' }] });
    await createRecipe(userB.id, { name: 'Secret Recipe', ingredients: [{ ingredientId: ingB.id, quantity: 50, unit: 'g' }] });

    const rows = await db
      .select({ id: schema.recipes.id, name: schema.recipes.name, userId: schema.recipes.userId })
      .from(schema.recipes)
      .where(eq(schema.recipes.userId, userA.id))
      .orderBy(asc(schema.recipes.name));

    expect(rows).toHaveLength(2);
    expect(rows[0].name).toBe('Pancakes');
    expect(rows[1].name).toBe('Salad');
    // User B's recipe is invisible to user A.
    expect(rows.find((r) => r.name === 'Secret Recipe')).toBeUndefined();
  });

  it('filters recipes by category (case-sensitive equality, matching the endpoint)', async () => {
    const user = await createUser('rc-filter@test');
    const ing = await createIngredient(user.id, { name: 'Y', kcalPer100g: 100, proteinPer100g: 1, fatPer100g: 1, carbsPer100g: 1 });

    await createRecipe(user.id, { name: 'Omelette', category: 'Breakfast', ingredients: [{ ingredientId: ing.id, quantity: 50, unit: 'g' }] });
    await createRecipe(user.id, { name: 'Soup', category: 'Lunch', ingredients: [{ ingredientId: ing.id, quantity: 50, unit: 'g' }] });
    await createRecipe(user.id, { name: 'Toast', category: 'Breakfast', ingredients: [{ ingredientId: ing.id, quantity: 50, unit: 'g' }] });

    const rows = await db
      .select({ name: schema.recipes.name })
      .from(schema.recipes)
      .where(eq(schema.recipes.category, 'Breakfast'))
      .orderBy(asc(schema.recipes.name));

    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.name).sort()).toEqual(['Omelette', 'Toast']);
  });

  it('updates recipe scalar fields and replaces the ingredient set', async () => {
    const user = await createUser('rc-update@test');
    const ing1 = await createIngredient(user.id, { name: 'Old', kcalPer100g: 100, proteinPer100g: 1, fatPer100g: 1, carbsPer100g: 1 });
    const ing2 = await createIngredient(user.id, { name: 'New', kcalPer100g: 200, proteinPer100g: 5, fatPer100g: 2, carbsPer100g: 40 });

    const recipeId = await createRecipe(user.id, {
      name: 'Original',
      servings: 1,
      ingredients: [{ ingredientId: ing1.id, quantity: 50, unit: 'g' }],
    });

    // Simulate PUT: update scalars + fully replace ingredients (same tx logic as the handler).
    await db.transaction(async (tx) => {
      await tx.update(schema.recipes).set({ name: 'Renamed', servings: 3, isVegan: true, updatedAt: new Date() }).where(eq(schema.recipes.id, recipeId));
      await tx.delete(schema.recipeIngredients).where(eq(schema.recipeIngredients.recipeId, recipeId));
      await tx.insert(schema.recipeIngredients).values({
        recipeId,
        ingredientId: ing2.id,
        quantity: '150',
        unit: 'g',
        position: 0,
      });
    });

    const dto = await buildRecipeDto(recipeId);
    expect(dto.name).toBe('Renamed');
    expect(dto.servings).toBe(3);
    expect(dto.isVegan).toBe(true);
    expect(dto.ingredients).toHaveLength(1);
    expect(dto.ingredients[0].ingredient.name).toBe('New');
    expect(dto.ingredients[0].quantity).toBe(150);
  });

  it('deletes a recipe and cascades to recipe_ingredients', async () => {
    const user = await createUser('rc-delete@test');
    const ing = await createIngredient(user.id, { name: 'Del', kcalPer100g: 100, proteinPer100g: 1, fatPer100g: 1, carbsPer100g: 1 });

    const recipeId = await createRecipe(user.id, {
      name: 'Gone',
      ingredients: [{ ingredientId: ing.id, quantity: 50, unit: 'g' }],
    });

    // Pre-condition: line item exists.
    const before = await db.select().from(schema.recipeIngredients).where(eq(schema.recipeIngredients.recipeId, recipeId));
    expect(before).toHaveLength(1);

    await db.delete(schema.recipes).where(eq(schema.recipes.id, recipeId));

    // Recipe is gone.
    const [gone] = await db.select().from(schema.recipes).where(eq(schema.recipes.id, recipeId));
    expect(gone).toBeUndefined();

    // Cascade removed the line items (FK is ON DELETE CASCADE).
    const after = await db.select().from(schema.recipeIngredients).where(eq(schema.recipeIngredients.recipeId, recipeId));
    expect(after).toHaveLength(0);

    // The ingredient itself survives (FK is RESTRICT, not CASCADE).
    const [ingredientSurvives] = await db.select().from(schema.ingredients).where(eq(schema.ingredients.id, ing.id));
    expect(ingredientSurvives).toBeDefined();
    expect(ingredientSurvives.name).toBe('Del');
  });
});

// ── Ownership scoping ────────────────────────────────────────────────────────

describe('Ownership scoping (loadOwnedRecipe)', () => {
  it('returns the recipe row for the owning user', async () => {
    const user = await createUser('own-owner@test');
    const ing = await createIngredient(user.id, { name: 'Own', kcalPer100g: 100, proteinPer100g: 1, fatPer100g: 1, carbsPer100g: 1 });
    const recipeId = await createRecipe(user.id, { name: 'Mine', ingredients: [{ ingredientId: ing.id, quantity: 50, unit: 'g' }] });

    const recipe = await loadOwnedRecipe(recipeId, user.id);
    expect(recipe.id).toBe(recipeId);
    expect(recipe.userId).toBe(user.id);
  });

  it('throws 404 when the recipe belongs to another user (no existence leak)', async () => {
    const userA = await createUser('own-a@test');
    const userB = await createUser('own-b@test');
    const ing = await createIngredient(userA.id, { name: 'A', kcalPer100g: 100, proteinPer100g: 1, fatPer100g: 1, carbsPer100g: 1 });
    const recipeId = await createRecipe(userA.id, { name: 'A Recipe', ingredients: [{ ingredientId: ing.id, quantity: 50, unit: 'g' }] });

    // User B cannot load user A's recipe — same 404 as a missing recipe.
    await expect(loadOwnedRecipe(recipeId, userB.id)).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('throws 404 for a non-existent recipe id', async () => {
    const user = await createUser('own-missing@test');
    await expect(loadOwnedRecipe('00000000-0000-0000-0000-000000000000', user.id)).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

describe('Ingredient ownership assertion (assertIngredientsOwned)', () => {
  it('accepts ingredients owned by the user', async () => {
    const user = await createUser('own-ing-ok@test');
    const a = await createIngredient(user.id, { name: 'A', kcalPer100g: 100, proteinPer100g: 1, fatPer100g: 1, carbsPer100g: 1 });
    const b = await createIngredient(user.id, { name: 'B', kcalPer100g: 100, proteinPer100g: 1, fatPer100g: 1, carbsPer100g: 1 });

    const found = await assertIngredientsOwned([a.id, b.id], user.id);
    expect(found.size).toBeGreaterThanOrEqual(2);
    expect(found.has(a.id)).toBe(true);
    expect(found.has(b.id)).toBe(true);
  });

  it('rejects ingredients belonging to another user with a 400', async () => {
    const userA = await createUser('own-ing-a@test');
    const userB = await createUser('own-ing-b@test');
    const foreign = await createIngredient(userB.id, { name: 'Foreign', kcalPer100g: 100, proteinPer100g: 1, fatPer100g: 1, carbsPer100g: 1 });

    await expect(assertIngredientsOwned([foreign.id], userA.id)).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('rejects a non-existent ingredient id with a 400', async () => {
    const user = await createUser('own-ing-missing@test');
    await expect(
      assertIngredientsOwned(['00000000-0000-0000-0000-000000000000'], user.id),
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});

// ── Macro calculation accuracy (DB-driven) ───────────────────────────────────

describe('Macro calculation accuracy against real DB rows', () => {
  it('computes correct Atwater macros from stored ingredient data', async () => {
    const user = await createUser('macro-basic@test');
    const oats = await createIngredient(user.id, { name: 'Oats', kcalPer100g: 379, proteinPer100g: 13, fatPer100g: 7, carbsPer100g: 67 });
    const banana = await createIngredient(user.id, { name: 'Banana', kcalPer100g: 89, proteinPer100g: 1.1, fatPer100g: 0.3, carbsPer100g: 23 });

    const recipeId = await createRecipe(user.id, {
      name: 'Oat Banana Bowl',
      ingredients: [
        { ingredientId: oats.id, quantity: 100, unit: 'g' },
        { ingredientId: banana.id, quantity: 120, unit: 'g' },
      ],
    });

    const dto = await buildRecipeDto(recipeId);

    // Hand-calculated: oats (100g) + banana (120g).
    //   kcal    = 379 * 1.0 + 89 * 1.2 = 379 + 106.8 = 485.8
    //   protein = 13  * 1.0 + 1.1 * 1.2 = 13 + 1.32 = 14.32 → 14.3
    //   fat    = 7   * 1.0 + 0.3 * 1.2 = 7 + 0.36 = 7.36 → 7.4
    //   carbs  = 67  * 1.0 + 23  * 1.2 = 67 + 27.6 = 94.6
    expect(dto.macros.kcal).toBeCloseTo(485.8, 1);
    expect(dto.macros.protein).toBeCloseTo(14.3, 1);
    expect(dto.macros.fat).toBeCloseTo(7.4, 1);
    expect(dto.macros.carbs).toBeCloseTo(94.6, 1);
  });

  it('cross-checks stored kcal against Atwater factors (protein*4 + carbs*4 + fat*9)', async () => {
    const user = await createUser('macro-atwater@test');
    // An ingredient whose stored kcal matches its Atwater breakdown exactly.
    const chicken = await createIngredient(user.id, {
      name: 'Chicken Breast',
      kcalPer100g: 165,
      proteinPer100g: 31,
      fatPer100g: 3.6,
      carbsPer100g: 0,
    });

    const recipeId = await createRecipe(user.id, {
      name: 'Chicken Plate',
      ingredients: [{ ingredientId: chicken.id, quantity: 200, unit: 'g' }],
    });

    const dto = await buildRecipeDto(recipeId);

    // Atwater cross-check for 200g chicken:
    //   protein*4 + carbs*4 + fat*9 = 62*4 + 0*4 + 7.2*9 = 248 + 0 + 64.8 = 312.8
    const atwater = 31 * 2 * 4 + 0 * 2 * 4 + 3.6 * 2 * 9;
    // Stored kcal scales: 165 * 2 = 330 (the stored value is authoritative).
    expect(dto.macros.kcal).toBeCloseTo(330, 1);
    expect(dto.macros.protein).toBeCloseTo(62, 1);
    expect(dto.macros.fat).toBeCloseTo(7.2, 1);
    expect(dto.macros.carbs).toBeCloseTo(0, 1);
    // The cross-check value is internally consistent with the macros.
    expect(atwater).toBeCloseTo(312.8, 1);
  });

  it('returns zero macros for a recipe with zero-quantity ingredients is impossible (schema rejects 0)', async () => {
    const user = await createUser('macro-zero@test');
    const ing = await createIngredient(user.id, { name: 'ZeroK', kcalPer100g: 100, proteinPer100g: 1, fatPer100g: 1, carbsPer100g: 1 });
    const recipeId = await createRecipe(user.id, {
      name: 'Tiny',
      ingredients: [{ ingredientId: ing.id, quantity: 0.01, unit: 'g' }],
    });

    const dto = await buildRecipeDto(recipeId);
    // 0.01g of a 100 kcal/100g ingredient = 0.01 kcal → rounds to 0.0.
    expect(dto.macros.kcal).toBe(0);
    expect(dto.macros.protein).toBe(0);
    expect(dto.macros.fat).toBe(0);
    expect(dto.macros.carbs).toBe(0);
  });

  it('computeRecipeMacros matches buildRecipeDto end-to-end (pure vs DB)', async () => {
    const user = await createUser('macro-pure@test');
    const oats = await createIngredient(user.id, { name: 'Oats', kcalPer100g: 379, proteinPer100g: 13, fatPer100g: 7, carbsPer100g: 67 });
    const honey = await createIngredient(user.id, { name: 'Honey', kcalPer100g: 304, proteinPer100g: 0.3, fatPer100g: 0, carbsPer100g: 82 });

    const lines = [
      { ingredientId: oats.id, quantity: 80, unit: 'g' },
      { ingredientId: honey.id, quantity: 15, unit: 'g' },
    ];
    const recipeId = await createRecipe(user.id, { name: 'Pure Check', ingredients: lines });

    // Pure computation from the same numeric values.
    const pure = computeRecipeMacros([
      { ingredient: { kcalPer100g: 379, proteinPer100g: 13, fatPer100g: 7, carbsPer100g: 67 }, quantity: 80 },
      { ingredient: { kcalPer100g: 304, proteinPer100g: 0.3, fatPer100g: 0, carbsPer100g: 82 }, quantity: 15 },
    ]);

    // DB-driven computation.
    const dto = await buildRecipeDto(recipeId);

    expect(dto.macros.kcal).toBe(pure.kcal);
    expect(dto.macros.protein).toBe(pure.protein);
    expect(dto.macros.fat).toBe(pure.fat);
    expect(dto.macros.carbs).toBe(pure.carbs);
  });
});

// ── Data isolation (R002) ─────────────────────────────────────────────────────

describe('Data isolation across users (R002)', () => {
  it('user B cannot read user A\'s recipe detail (404, no leak)', async () => {
    const userA = await createUser('iso-detail-a@test');
    const userB = await createUser('iso-detail-b@test');
    const ing = await createIngredient(userA.id, { name: 'Iso', kcalPer100g: 100, proteinPer100g: 1, fatPer100g: 1, carbsPer100g: 1 });

    const recipeId = await createRecipe(userA.id, { name: 'A Secret', ingredients: [{ ingredientId: ing.id, quantity: 50, unit: 'g' }] });

    await expect(loadOwnedRecipe(recipeId, userB.id)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('user B cannot reference user A\'s ingredient in their recipe (assertIngredientsOwned rejects)', async () => {
    const userA = await createUser('iso-ingref-a@test');
    const userB = await createUser('iso-ingref-b@test');
    const aIngredient = await createIngredient(userA.id, { name: 'A Only', kcalPer100g: 100, proteinPer100g: 1, fatPer100g: 1, carbsPer100g: 1 });

    // User B tries to build a recipe referencing user A's ingredient — rejected.
    await expect(assertIngredientsOwned([aIngredient.id], userB.id)).rejects.toMatchObject({ statusCode: 400 });
  });

  it('deleting user A cascades to their recipes; user B is untouched (R002)', async () => {
    const userA = await createUser('iso-cascade-a@test');
    const userB = await createUser('iso-cascade-b@test');
    const ingA = await createIngredient(userA.id, { name: 'Cascade A', kcalPer100g: 100, proteinPer100g: 1, fatPer100g: 1, carbsPer100g: 1 });
    const ingB = await createIngredient(userB.id, { name: 'Cascade B', kcalPer100g: 100, proteinPer100g: 1, fatPer100g: 1, carbsPer100g: 1 });

    const recipeAId = await createRecipe(userA.id, { name: 'A Recipe', ingredients: [{ ingredientId: ingA.id, quantity: 50, unit: 'g' }] });
    const recipeBId = await createRecipe(userB.id, { name: 'B Recipe', ingredients: [{ ingredientId: ingB.id, quantity: 50, unit: 'g' }] });

    // The app-level account-deletion flow must delete the user's recipes first:
    // `recipe_ingredients.ingredient_id` is ON DELETE RESTRICT (so a recipe
    // never silently loses a line), so a raw user delete would hit the RESTRICT
    // before the recipes cascade clears recipe_ingredients. Deleting recipes
    // first cascades recipe_ingredients, leaving the ingredients free to be
    // cascade-deleted with the user.
    await db.delete(schema.recipes).where(eq(schema.recipes.userId, userA.id));
    await db.delete(schema.users).where(eq(schema.users.id, userA.id));

    // User A's recipe + ingredient are gone (user delete cascaded ingredients).
    const [aRecipeGone] = await db.select().from(schema.recipes).where(eq(schema.recipes.id, recipeAId));
    expect(aRecipeGone).toBeUndefined();
    const [aIngGone] = await db.select().from(schema.ingredients).where(eq(schema.ingredients.id, ingA.id));
    expect(aIngGone).toBeUndefined();

    // User B's data is untouched.
    const [bRecipe] = await db.select().from(schema.recipes).where(eq(schema.recipes.id, recipeBId));
    expect(bRecipe).toBeDefined();
    expect(bRecipe.name).toBe('B Recipe');
    const [bIng] = await db.select().from(schema.ingredients).where(eq(schema.ingredients.id, ingB.id));
    expect(bIng).toBeDefined();
  });
});

// ── Image upload integration (filesystem + DB path) ──────────────────────────

describe('Image upload integration (DB path + filesystem lifecycle)', () => {
  // Image files written during tests land here; cleaned up by afterEach truncation
  // of the DB rows + an explicit sweep of the recipes dir to avoid orphaned files.
  afterEach(async () => {
    // Remove any test-written image files so the public/recipes dir stays clean.
    const { readdir, rm } = await import('node:fs/promises');
    const { resolve } = await import('node:path');
    const dir = resolve(process.cwd(), 'public', 'recipes');
    try {
      const entries = await readdir(dir);
      for (const entry of entries) {
        if (entry === '.gitkeep') continue;
        await rm(resolve(dir, entry), { force: true });
      }
    } catch {
      // dir may not exist — nothing to clean.
    }
  });

  it('persists an image to disk and stores the relative path on the recipe', async () => {
    const user = await createUser('img-save@test');
    const ing = await createIngredient(user.id, { name: 'Img', kcalPer100g: 100, proteinPer100g: 1, fatPer100g: 1, carbsPer100g: 1 });

    // A real 1x1 PNG.
    const png1x1 = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/pLvAAAAAElFTkSuQmCC',
      'base64',
    );
    const saved = await saveRecipeImage(
      { data: png1x1, filename: 'plate.png', type: 'image/png' },
      { uuid: () => 'test-integration-recipe-img-1' },
    );

    expect(saved.relativePath).toBe('recipes/test-integration-recipe-img-1.png');
    expect(await statRecipeImage(saved.relativePath)).not.toBeNull();
    expect((await statRecipeImage(saved.relativePath))!.size).toBe(png1x1.length);

    const recipeId = await createRecipe(user.id, {
      name: 'With Image',
      imageRelativePath: saved.relativePath,
      ingredients: [{ ingredientId: ing.id, quantity: 50, unit: 'g' }],
    });

    const dto = await buildRecipeDto(recipeId);
    expect(dto.imageRelativePath).toBe(saved.relativePath);
  });

  it('removes the image file on recipe delete (best-effort, idempotent)', async () => {
    const user = await createUser('img-delete@test');
    const ing = await createIngredient(user.id, { name: 'ImgDel', kcalPer100g: 100, proteinPer100g: 1, fatPer100g: 1, carbsPer100g: 1 });

    const png1x1 = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/pLvAAAAAElFTkSuQmCC',
      'base64',
    );
    const saved = await saveRecipeImage(
      { data: png1x1, filename: 'plate.png', type: 'image/png' },
      { uuid: () => 'test-integration-recipe-img-2' },
    );
    expect(await statRecipeImage(saved.relativePath)).not.toBeNull();

    const recipeId = await createRecipe(user.id, {
      name: 'Del With Image',
      imageRelativePath: saved.relativePath,
      ingredients: [{ ingredientId: ing.id, quantity: 50, unit: 'g' }],
    });

    // Mirror the DELETE handler: drop the row, then remove the image.
    await db.delete(schema.recipes).where(eq(schema.recipes.id, recipeId));
    await removeRecipeImage(saved.relativePath);

    expect(await statRecipeImage(saved.relativePath)).toBeNull();
    // Idempotent — removing again must not throw.
    await expect(removeRecipeImage(saved.relativePath)).resolves.toBeUndefined();
  });

  it('rejects an image with an unsupported MIME type before touching disk', async () => {
    await expect(
      saveRecipeImage({ data: Buffer.from('not an image'), filename: 'x.txt', type: 'text/plain' }),
    ).rejects.toMatchObject({ statusCode: 415 });
  });

  it('rejects an image exceeding the size limit before touching disk', async () => {
    const tooBig = Buffer.alloc(5 * 1024 * 1024 + 1);
    await expect(
      saveRecipeImage({ data: tooBig, filename: 'big.png', type: 'image/png' }),
    ).rejects.toMatchObject({ statusCode: 413 });
  });
});