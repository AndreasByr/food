import { beforeAll, afterEach } from 'vitest';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../server/db/schema';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// ─────────────────────────────────────────────────────────────────────────────
// Load .env so `npx vitest run` works without manually exporting env vars.
// Vitest does not auto-load .env; integration tests need DATABASE_URL + JWT_SECRET.
// Only sets vars that are not already present in the process env (shell env wins).
// ─────────────────────────────────────────────────────────────────────────────
function loadEnvFile() {
  const envPath = resolve(process.cwd(), '.env');
  if (!existsSync(envPath)) return;
  const raw = readFileSync(envPath, 'utf-8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    // Strip surrounding quotes if present.
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (val.length === 0) continue;
    // Shell env takes precedence over .env — never overwrite an explicit value.
    if (process.env[key] === undefined) {
      process.env[key] = val;
    }
  }
}
loadEnvFile();

// ─────────────────────────────────────────────────────────────────────────────
// Nitro auto-import polyfill for unit tests.
//
// Server utils like `createError` are auto-imported by Nitro at runtime. Unit
// tests run in a plain Node/Vitest environment without those auto-imports, so
// modules that reference `createError` (e.g. image-upload.ts) need a compatible
// global. This shim builds an Error subclass with the H3 error shape
// (`statusCode`, `statusMessage`, `data`) so unit tests can assert on it.
// ─────────────────────────────────────────────────────────────────────────────
class H3ErrorShim extends Error {
  statusCode: number;
  statusMessage: string;
  data: unknown;
  constructor(opts: { statusCode?: number; statusMessage?: string; message?: string; data?: unknown }) {
    super(opts.message ?? opts.statusMessage ?? 'Error');
    this.name = 'H3Error';
    this.statusCode = opts.statusCode ?? 500;
    this.statusMessage = opts.statusMessage ?? '';
    this.data = opts.data;
  }
}
if (!(globalThis as Record<string, unknown>).createError) {
  (globalThis as Record<string, unknown>).createError = (opts: Record<string, unknown>) =>
    new H3ErrorShim(opts as { statusCode?: number; statusMessage?: string; data?: unknown });
}

// ─────────────────────────────────────────────────────────────────────────────
// Test setup — runs once before all test suites.
//
// 1. Reads DATABASE_URL from env (must point to a test DB, never production).
// 2. Applies the Drizzle migration to ensure the schema is current.
// 3. Provides a `truncateAll` helper that test suites call in afterEach.
// ─────────────────────────────────────────────────────────────────────────────

const dbUrl = process.env.DATABASE_URL;

// Only set up the DB if DATABASE_URL is provided (integration tests).
// Unit tests don't need a database and skip this setup.
const hasDb = !!dbUrl;

if (hasDb) {
  // Ensure we're not pointing at production.
  if (dbUrl!.includes('production') || dbUrl!.includes('prod')) {
    throw new Error('DATABASE_URL appears to point at production — refusing to run tests.');
  }
}

const client = hasDb ? postgres(dbUrl!, { max: 5, idle_timeout: 10, connect_timeout: 10 }) : null as unknown as ReturnType<typeof postgres>;
const db = hasDb ? drizzle(client, { schema }) : null as unknown as ReturnType<typeof drizzle>;

// Apply migration before any tests run (integration tests only).
if (hasDb) {
  beforeAll(async () => {
    // Read and execute the migration SQL directly.
    const migrationPath = resolve(__dirname, '..', 'drizzle', '0000_init.sql');
    const sql = readFileSync(migrationPath, 'utf-8');
    await client.unsafe(sql);
  }, 30_000);

  // Truncate all tables between tests for isolation.
  afterEach(async () => {
    const tables = [
      'supplement_reminders',
      'supplements',
      'shopping_list_items',
      'shopping_lists',
      'inventory',
      'recipe_ingredients',
      'recipes',
      'ingredients',
      'refresh_tokens',
      'users',
    ];
    for (const table of tables) {
      await client.unsafe(`TRUNCATE TABLE "${table}" CASCADE`);
    }
  });
}

export { db, client, schema };
