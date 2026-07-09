import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import autoImport from 'unplugin-auto-import/vite';
import { resolve } from 'node:path';

const root = resolve(__dirname, '../..');
const appDir = resolve(root, 'app');

/**
 * Replace Nuxt-only `import.meta.client` / `import.meta.server` literals so
 * client-only composables behave correctly under jsdom.
 */
function nuxtMetaPlugin() {
  return {
    name: 'nuxt-meta-replace',
    transform(code: string, id: string) {
      if (!id.includes('/app/') && !id.includes('\\app\\')) return;
      if (!/\.(ts|vue)$/.test(id)) return;
      let changed = false;
      const replaced = code
        .replace(/import\.meta\.client\b/g, () => {
          changed = true;
          return 'true';
        })
        .replace(/import\.meta\.server\b/g, () => {
          changed = true;
          return 'false';
        });
      return changed ? replaced : undefined;
    },
  };
}

/**
 * Component-test project configuration.
 *
 * - jsdom DOM environment
 * - Vue SFC support via @vitejs/plugin-vue
 * - import.meta.client forced true so client-only composables behave correctly
 * - Aliased '~' and '@' to the Nuxt app directory (app/)
 * - Auto-imports mirror Nuxt's behavior so components/pages can run without
 *   the Nuxt runtime (stores, composables, vue/pinia APIs, nuxt globals)
 */
export default defineConfig({
  plugins: [
    nuxtMetaPlugin(),
    vue(),
    autoImport({
      dts: false,
      include: [/\.test\.[jt]sx?$/, /app\/(components|composables|pages|stores|utils)\/.*\.([jt]sx?|vue)$/],
      imports: [
        { vue: ['ref', 'computed', 'watch', 'onMounted', 'readonly', 'nextTick'] },
        { pinia: ['defineStore'] },
        { [resolve(__dirname, 'nuxt-globals.ts')]: ['$fetch', 'navigateTo', 'definePageMeta', 'useRoute', 'useRuntimeConfig'] },
        { [resolve(appDir, 'stores/auth.ts')]: ['useAuthStore'] },
        { [resolve(appDir, 'stores/theme.ts')]: ['useThemeStore'] },
        { [resolve(appDir, 'stores/recipes.ts')]: ['useRecipeStore'] },
        { [resolve(appDir, 'composables/useTheme.ts')]: ['useTheme'] },
        { [resolve(appDir, 'composables/useOnboarding.ts')]: ['useOnboarding'] },
        { [resolve(appDir, 'composables/useApi.ts')]: ['useApi'] },
        { [resolve(appDir, 'utils/api-error.ts')]: ['parseApiError'] },
      ],
    }),
  ],
  define: {
    'import.meta.client': 'true',
    'import.meta.server': 'false',
  },
  test: {
    name: 'components',
    environment: 'jsdom',
    setupFiles: [resolve(__dirname, 'setup.ts')],
    include: [resolve(__dirname, '**/*.test.ts')],
    globals: false,
  },
  resolve: {
    alias: {
      '~': appDir,
      '@': appDir,
    },
  },
});
