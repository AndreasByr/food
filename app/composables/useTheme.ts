import type { ThemeMode } from '~/stores/theme';

const STORAGE_KEY = 'foodora-theme';

/**
 * Client-only theme composable.
 *
 * - Reads the persisted choice (or system preference) on mount.
 * - Toggles the `.dark` class on `<html>`.
 * - Persists the choice to `localStorage`.
 *
 * Because the Nuxt app is configured as an SPA, this runs entirely on the
 * client; `import.meta.client` guards are kept for safety during `nuxt prepare`.
 */
export function useTheme() {
  const store = useThemeStore();

  function applyClass() {
    if (!import.meta.client) return;
    document.documentElement.classList.toggle('dark', store.isDark);
  }

  function readInitial(): ThemeMode {
    if (!import.meta.client) return 'light';

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }

  onMounted(() => {
    store.setTheme(readInitial());
    applyClass();
  });

  watch(
    () => store.theme,
    (value) => {
      if (import.meta.client) {
        localStorage.setItem(STORAGE_KEY, value);
      }
      applyClass();
    },
    { immediate: false },
  );

  return {
    theme: computed(() => store.theme),
    isDark: computed(() => store.isDark),
    setTheme: store.setTheme,
    toggle: store.toggle,
  };
}
