/**
 * Theme store (Pinia)
 *
 * Holds the user's explicit theme choice. The actual DOM class syncing and
 * localStorage persistence live in the `useTheme` composable so that storage
 * access only happens on the client.
 */
export type ThemeMode = 'light' | 'dark';

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<ThemeMode>('light');

  const isDark = computed(() => theme.value === 'dark');

  function setTheme(value: ThemeMode) {
    theme.value = value;
  }

  function toggle() {
    theme.value = theme.value === 'light' ? 'dark' : 'light';
  }

  return {
    theme: readonly(theme),
    isDark,
    setTheme,
    toggle,
  };
});
