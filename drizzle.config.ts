import { defineConfig } from 'drizzle-kit';

// Drizzle Kit reads DATABASE_URL from the environment to resolve the driver
// for `generate`/`migrate`/`push`. The schema source is the single file below.
export default defineConfig({
  schema: './server/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
  strict: true,
  verbose: true,
});