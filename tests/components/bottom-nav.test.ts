import { describe, expect, it } from 'vitest';
import { flushPromises } from '@vue/test-utils';

import BottomNav from '~/components/BottomNav.vue';
import { mountWithPinia, setRoutePath } from './test-utils';

describe('BottomNav', () => {
  it('renders all five tabs with labels and links', async () => {
    mountWithPinia(BottomNav);
    await flushPromises();

    const tabs = document.body.querySelectorAll('.bottom-nav__tab');
    expect(tabs).toHaveLength(5);

    const labels = Array.from(document.body.querySelectorAll('.bottom-nav__label')).map(
      (el) => el.textContent,
    );
    expect(labels).toEqual(['Heute', 'Plan', 'Liste', 'Lager', 'Einstellungen']);

    const links = Array.from(document.body.querySelectorAll('.bottom-nav__tab')).map(
      (el) => el.getAttribute('href'),
    );
    expect(links).toEqual(['/', '/plan', '/liste', '/lager', '/einstellungen']);
  });

  it('highlights the active tab based on the current route', async () => {
    setRoutePath('/plan');
    mountWithPinia(BottomNav);
    await flushPromises();

    const active = document.body.querySelector('.bottom-nav__tab--active');
    expect(active?.getAttribute('href')).toBe('/plan');
    expect(active?.getAttribute('aria-current')).toBe('page');
  });

  it('keeps the home tab active only on the exact root path', async () => {
    setRoutePath('/');
    mountWithPinia(BottomNav);
    await flushPromises();

    const active = document.body.querySelector('.bottom-nav__tab--active');
    expect(active?.getAttribute('href')).toBe('/');
  });
});
