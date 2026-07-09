import { mount, type ComponentMountingOptions, type VueWrapper } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import type { Component } from 'vue';

import { currentRoute } from './setup';

/**
 * Mount a component with a fresh Pinia store and sensible jsdom defaults.
 */
export function mountWithPinia<T extends Component>(
  component: T,
  options: ComponentMountingOptions<T> = {},
): VueWrapper<InstanceType<T>> {
  const pinia = createPinia();
  setActivePinia(pinia);

  return mount(component, {
    attachTo: document.body,
    global: {
      plugins: [pinia],
    },
    ...options,
  } as ComponentMountingOptions<T>);
}

/**
 * Set the mocked current route path (used by useRoute in BottomNav tests).
 */
export function setRoutePath(path: string): void {
  currentRoute.path = path;
}
