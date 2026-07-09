import { sql } from 'drizzle-orm';
import {
  boolean,
  date,
  numeric,
  pgTable,
  integer,
  smallint,
  text,
  time,
  timestamp,
  uniqueIndex,
  index,
  uuid,
} from 'drizzle-orm/pg-core';

// ─────────────────────────────────────────────────────────────────────────────
// Foodora schema (M1–M7)
//
// All tables are created in M1 even though only `users` and `refresh_tokens`
// are exercised at runtime this milestone (decision MEM004 / D004). Every
// user-scoped table carries a `user_id` index so "list mine" queries are an
// index scan, and every FK child side is indexed for fast cascading deletes.
//
// Conventions:
//  - uuid PKs via gen_random_uuid() (built-in on Postgres 13+).
//  - timestamptz for all timestamps.
//  - numeric(...) for macro quantities — avoids float precision loss on grams.
//  - emails are stored lowercase; uniqueness is enforced on lower(email).
// ─────────────────────────────────────────────────────────────────────────────

// ── M1: Auth ──────────────────────────────────────────────────────────────────

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    name: text('name'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    // Case-insensitive unique email — lookup and dedup both go through lower(email).
    emailUnique: uniqueIndex('users_email_lower_unique').on(sql`lower(${t.email})`),
    createdAtIdx: index('users_created_at_idx').on(t.createdAt),
  }),
);

export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // sha256 of the raw refresh JWT — a DB leak does not directly expose live tokens.
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    // null = active; set on rotation/logout.
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
  },
  (t) => ({
    userIdIdx: index('refresh_tokens_user_id_idx').on(t.userId),
    expiresAtIdx: index('refresh_tokens_expires_at_idx').on(t.expiresAt),
  }),
);

// ── M2: Ingredients + Recipes ─────────────────────────────────────────────────

export const ingredients = pgTable(
  'ingredients',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    defaultUnit: text('default_unit').notNull().default('g'),
    kcalPer100g: numeric('kcal_per_100g', { precision: 7, scale: 2 }).notNull(),
    proteinPer100g: numeric('protein_per_100g', { precision: 6, scale: 2 }).notNull(),
    fatPer100g: numeric('fat_per_100g', { precision: 6, scale: 2 }).notNull(),
    carbsPer100g: numeric('carbs_per_100g', { precision: 6, scale: 2 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    // One ingredient per (user, name) — case-insensitive.
    userNameUnique: uniqueIndex('ingredients_user_lower_name_unique').on(
      t.userId,
      sql`lower(${t.name})`,
    ),
    userIdIdx: index('ingredients_user_id_idx').on(t.userId),
  }),
);

export const recipes = pgTable(
  'recipes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    prepSteps: text('prep_steps'),
    // Simple label in M1; M2 introduces the slot system on top of this.
    category: text('category'),
    imageRelativePath: text('image_path'),
    servings: integer('servings').notNull().default(1),
    isVegan: boolean('is_vegan').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdIdx: index('recipes_user_id_idx').on(t.userId),
    userCategoryIdx: index('recipes_user_category_idx').on(t.userId, t.category),
  }),
);

export const recipeIngredients = pgTable(
  'recipe_ingredients',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    recipeId: uuid('recipe_id')
      .notNull()
      .references(() => recipes.id, { onDelete: 'cascade' }),
    // RESTRICT: don't silently lose a recipe's line when an ingredient is deleted.
    ingredientId: uuid('ingredient_id')
      .notNull()
      .references(() => ingredients.id, { onDelete: 'restrict' }),
    quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull(),
    unit: text('unit').notNull(),
    position: integer('position').notNull().default(0),
  },
  (t) => ({
    recipeIdIdx: index('recipe_ingredients_recipe_id_idx').on(t.recipeId),
    ingredientIdIdx: index('recipe_ingredients_ingredient_id_idx').on(t.ingredientId),
  }),
);

// ── M3: Inventory ──────────────────────────────────────────────────────────────

export const inventory = pgTable(
  'inventory',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    ingredientId: uuid('ingredient_id')
      .notNull()
      .references(() => ingredients.id, { onDelete: 'restrict' }),
    quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull().default('0'),
    unit: text('unit').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdIdx: index('inventory_user_id_idx').on(t.userId),
    userIngredientIdx: index('inventory_user_ingredient_idx').on(t.userId, t.ingredientId),
  }),
);

// ── M4: Shopping lists ─────────────────────────────────────────────────────────

export const shoppingLists = pgTable(
  'shopping_lists',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    // Monday of the target ISO week.
    weekStart: date('week_start').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    // Only one list per user per week.
    userWeekUnique: uniqueIndex('shopping_lists_user_week_unique').on(t.userId, t.weekStart),
  }),
);

export const shoppingListItems = pgTable(
  'shopping_list_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    listId: uuid('list_id')
      .notNull()
      .references(() => shoppingLists.id, { onDelete: 'cascade' }),
    ingredientId: uuid('ingredient_id')
      .notNull()
      .references(() => ingredients.id, { onDelete: 'restrict' }),
    quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull(),
    unit: text('unit').notNull(),
    // 'picnic' | 'koro' | null — where this item was suggested from.
    source: text('source'),
    isChecked: boolean('is_checked').notNull().default(false),
    position: integer('position').notNull().default(0),
  },
  (t) => ({
    listIdIdx: index('shopping_list_items_list_id_idx').on(t.listId),
    listCheckedIdx: index('shopping_list_items_list_checked_idx').on(t.listId, t.isChecked),
  }),
);

// ── M5: Supplements + reminders ───────────────────────────────────────────────

export const supplements = pgTable(
  'supplements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    notes: text('notes'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdIdx: index('supplements_user_id_idx').on(t.userId),
  }),
);

export const supplementReminders = pgTable(
  'supplement_reminders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    supplementId: uuid('supplement_id')
      .notNull()
      .references(() => supplements.id, { onDelete: 'cascade' }),
    timeOfDay: time('time_of_day').notNull(),
    // Bitmask Mon=1 ... Sun=64; 127 = every day.
    daysOfWeek: smallint('days_of_week').notNull().default(127),
    label: text('label'),
    isActive: boolean('is_active').notNull().default(true),
  },
  (t) => ({
    supplementIdIdx: index('supplement_reminders_supplement_id_idx').on(t.supplementId),
    activeTimeIdx: index('supplement_reminders_active_time_idx').on(t.isActive, t.timeOfDay),
  }),
);