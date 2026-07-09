import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';

import SettingsPage from '~/pages/einstellungen.vue';
import { useAuthStore } from '~/stores/auth';
import { useThemeStore } from '~/stores/theme';
import { mountWithPinia } from './test-utils';

describe('SettingsPage theme toggle', () => {
  it('renders the user profile and theme control', async () => {
    const wrapper = mountWithPinia(SettingsPage);
    await flushPromises();

    const auth = useAuthStore();
    auth.user = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date().toISOString(),
    };
    await flushPromises();

    expect(document.body.querySelector('.settings-card__name')?.textContent).toContain('Test User');
    expect(document.body.querySelector('.settings-card__email')?.textContent).toContain(
      'test@example.com',
    );
    expect(document.body.querySelector('.settings-card__value')?.textContent).toMatch(/Hell|Dunkel/);

    wrapper.unmount();
  });

  it('toggles from light to dark and updates localStorage', async () => {
    localStorage.setItem('foodora-theme', 'light');
    const wrapper = mountWithPinia(SettingsPage);
    await flushPromises();

    const themeStore = useThemeStore();
    expect(themeStore.theme).toBe('light');

    const toggle = document.body.querySelector('.settings-card__action--secondary') as HTMLButtonElement | null;
    await toggle!.click();
    await flushPromises();

    expect(themeStore.theme).toBe('dark');
    expect(localStorage.getItem('foodora-theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    wrapper.unmount();
  });

  it('toggles from dark to light and updates localStorage', async () => {
    localStorage.setItem('foodora-theme', 'dark');
    document.documentElement.classList.add('dark');
    const wrapper = mountWithPinia(SettingsPage);
    await flushPromises();

    const themeStore = useThemeStore();
    expect(themeStore.theme).toBe('dark');

    const toggle = document.body.querySelector('.settings-card__action--secondary') as HTMLButtonElement | null;
    await toggle!.click();
    await flushPromises();

    expect(themeStore.theme).toBe('light');
    expect(localStorage.getItem('foodora-theme')).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    wrapper.unmount();
  });

  it('calls auth.logout and navigates to login when logout is clicked', async () => {
    const wrapper = mountWithPinia(SettingsPage);
    await flushPromises();

    const auth = useAuthStore();
    vi.spyOn(auth, 'logout').mockResolvedValue(undefined);

    const logout = document.body.querySelector('.settings-card__action--danger') as HTMLButtonElement | null;
    await logout!.click();
    await flushPromises();

    expect(auth.logout).toHaveBeenCalled();
    expect(navigateTo).toHaveBeenCalledWith('/login');

    wrapper.unmount();
  });
});
