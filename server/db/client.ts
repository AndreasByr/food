import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// ─────────────────────────────────────────────────────────────────────────────
// HMR-safe Postgres + Drizzle singleton.
//
// Nitro's dev server reloads server modules on file change. If the Postgres
// client were instantiated at module scope on every reload, each reload would
// open a new connection and exhaust `max_connections` within ~30 reloads.
// Stashing the client on globalThis survives HMR cycles. Standard Nitro pattern.
// ─────────────────────────────────────────────────────────────────────────────

type DbClient = ReturnType<typeof postgres>;
type DrizzleDb = ReturnType<typeof createDb>["db"];

interface GlobalWithDb {
  __foodoraDb__?: { client: DbClient; db: DrizzleDb };
}

const globalRef = globalThis as unknown as GlobalWithDb;

function resolveDbUrl(): string {
  // useRuntimeConfig is only available inside Nitro event/server context at
  // runtime; for module-level resolution we fall back to the env var directly.
  // nuxt.config populates runtimeConfig.dbUrl from the same env var.
  const fromEnv = process.env.DATABASE_URL;
  if (fromEnv && fromEnv.length > 0) return fromEnv;
  try {
    // Lazy import of runtime config when running inside Nitro.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const cfg = (globalThis as { __nuxt_runtime__?: { dbUrl?: string } }).__nuxt_runtime__;
    if (cfg?.dbUrl) return cfg.dbUrl;
  } catch {
    // ignore — handled below
  }
  throw new Error(
    'DATABASE_URL is not set. Provide it via env (see .env.example) or Coolify env vars.',
  );
}

function createDb() {
  const url = resolveDbUrl();
  const client = postgres(url, {
    // postgres.js defaults are sane; max is tuned for a single Coolify container.
    max: 10,
    idle_timeout: 30,
    connect_timeout: 10,
    // Drizzle expects a single result row mode; postgres.js default is fine.
    onnotice: () => {
      /* swallow NOTICE messages — Drizzle migrations emit harmless notices */
    },
  });
  const db = drizzle(client, { schema });
  return { client, db };
}

export const db: DrizzleDb = (() => {
  if (!globalRef.__foodoraDb__) {
    globalRef.__foodoraDb__ = createDb();
  }
  return globalRef.__foodoraDb__!.db;
})();

export { schema };
export type Db = DrizzleDb;