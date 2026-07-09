import { vi } from 'vitest';
import { reactive } from 'vue';

/**
 * Mock implementations of Nuxt runtime globals for component tests.
 *
 * These replace the auto-imported `$fetch`, `navigateTo`, `definePageMeta`,
 * and `useRoute` that are normally provided by the Nuxt runtime.
 */

export const currentRoute = reactive({ path: '/' });

export const $fetch = vi.fn();
export const navigateTo = vi.fn(() => Promise.resolve(undefined));
export const definePageMeta = () => {};
export const useRoute = () => currentRoute;
export const useRuntimeConfig = () => ({ public: { apiBaseUrl: '' } });
