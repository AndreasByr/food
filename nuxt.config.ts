// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },

  // M1 ships the web/PWA surface as an SPA; the Tauri mobile shell is built
  // separately from this Nuxt app. SSR is disabled to keep the mobile shell
  // simple and to avoid shipping server-side secrets to the client.
  ssr: false,
  spaLoadingTemplate: true,

  modules: ['@pinia/nuxt'],
  css: ['~/assets/tokens.css'],

  runtimeConfig: {
    // Server-only secrets — never exposed to the client.
    dbUrl: process.env.DATABASE_URL ?? '',
    jwtSecret: process.env.JWT_SECRET ?? '',
    jwtAccessTtlSec: Number(process.env.JWT_ACCESS_TTL ?? 900),
    jwtRefreshTtlSec: Number(process.env.JWT_REFRESH_TTL ?? 604800),
  },

  app: {
    head: {
      title: 'Foodora',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'description', content: 'Foodora – deterministic meal planning' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap',
        },
      ],
      script: [
        {
          innerHTML: `
            (function () {
              try {
                const stored = localStorage.getItem('foodora-theme');
                const dark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
                document.documentElement.classList.toggle('dark', dark);
              } catch (_) {}
            })();
          `,
          tagPriority: 'high',
        },
      ],
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
