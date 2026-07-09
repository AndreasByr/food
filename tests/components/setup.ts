import { config } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, vi } from 'vitest';

import { $fetch, navigateTo, currentRoute } from './nuxt-globals';

export { currentRoute };

// ─────────────────────────────────────────────────────────────────────────────
// Per-test isolation: fresh Pinia + clean client state.
// ─────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  const pinia = createPinia();
  setActivePinia(pinia);
  localStorage.clear();
  currentRoute.path = '/';
  document.documentElement.classList.remove('dark');
  ($fetch as ReturnType<typeof vi.fn>).mockClear();
  (navigateTo as ReturnType<typeof vi.fn>).mockClear();

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

// Stub NuxtLink as a plain anchor so tests can inspect href and active state.
config.global.stubs.NuxtLink = {
  props: ['to'],
  template: '<a :href="to"><slot /></a>',
};

export { createPinia };
