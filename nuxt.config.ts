// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },

  modules: [],

  runtimeConfig: {
    // Server-only secrets — never exposed to the client.
    dbUrl: process.env.DATABASE_URL ?? '',
    jwtSecret: process.env.JWT_SECRET ?? '',
    jwtAccessTtlSec: Number(process.env.JWT_ACCESS_TTL ?? 900),
    jwtRefreshTtlSec: Number(process.env.JWT_REFRESH_TTL ?? 604800),
  },

  // App-level config is intentionally minimal — S01 is backend-only.
  app: {
    head: {
      title: 'Foodora',
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
    },
  },

  nitro: {
    experimental: {
      // postgres.js uses async local storage / dynamic imports; this keeps it compatible.
      tasks: false,
    },
  },

  typescript: {
    strict: true,
  },
});