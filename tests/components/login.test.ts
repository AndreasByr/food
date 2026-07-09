import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';

import LoginPage from '~/pages/login.vue';
import { useAuthStore } from '~/stores/auth';
import { mountWithPinia } from './test-utils';

describe('LoginPage', () => {
  it('renders the login form with email and password fields', async () => {
    const wrapper = mountWithPinia(LoginPage);
    await flushPromises();

    expect(document.body.querySelector('h1')?.textContent).toContain('Anmelden');
    expect(document.body.querySelector('#login-email')).not.toBeNull();
    expect(document.body.querySelector('#login-password')).not.toBeNull();

    wrapper.unmount();
  });

  it('keeps the submit button disabled until both fields have values', async () => {
    const wrapper = mountWithPinia(LoginPage);
    await flushPromises();

    const submit = document.body.querySelector('.auth-form__submit') as HTMLButtonElement | null;
    expect(submit?.disabled).toBe(true);

    const email = document.body.querySelector('#login-email') as HTMLInputElement | null;
    email!.value = 'test@example.com';
    await email!.dispatchEvent(new Event('input'));
    await flushPromises();
    expect(submit?.disabled).toBe(true);

    const password = document.body.querySelector('#login-password') as HTMLInputElement | null;
    password!.value = 'password123';
    await password!.dispatchEvent(new Event('input'));
    await flushPromises();
    expect(submit?.disabled).toBe(false);

    wrapper.unmount();
  });

  it('calls auth.login and navigates to home on successful submit', async () => {
    const wrapper = mountWithPinia(LoginPage);
    await flushPromises();

    const auth = useAuthStore();
    vi.spyOn(auth, 'login').mockResolvedValue({
      user: { id: '1', email: 'test@example.com', name: 'Test', createdAt: new Date().toISOString() },
      accessToken: 'access',
      refreshToken: 'refresh',
    });

    const email = document.body.querySelector('#login-email') as HTMLInputElement | null;
    email!.value = 'test@example.com';
    await email!.dispatchEvent(new Event('input'));

    const password = document.body.querySelector('#login-password') as HTMLInputElement | null;
    password!.value = 'password123';
    await password!.dispatchEvent(new Event('input'));
    await flushPromises();

    const form = document.body.querySelector('.auth-form') as HTMLFormElement | null;
    await form!.dispatchEvent(new Event('submit'));
    await flushPromises();

    expect(auth.login).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password123' });
    expect(navigateTo).toHaveBeenCalledWith('/');

    wrapper.unmount();
  });

  it('renders field-level and form-level errors on failed login', async () => {
    const wrapper = mountWithPinia(LoginPage);
    await flushPromises();

    const auth = useAuthStore();
    const error = {
      statusCode: 401,
      statusMessage: 'Unauthorized',
      data: {
        statusCode: 401,
        message: 'Ungültige Anmeldedaten.',
        errors: { password: ['Passwort ist falsch.'] },
      },
    };
    vi.spyOn(auth, 'login').mockRejectedValue(error);

    const email = document.body.querySelector('#login-email') as HTMLInputElement | null;
    email!.value = 'test@example.com';
    await email!.dispatchEvent(new Event('input'));

    const password = document.body.querySelector('#login-password') as HTMLInputElement | null;
    password!.value = 'wrong';
    await password!.dispatchEvent(new Event('input'));
    await flushPromises();

    const form = document.body.querySelector('.auth-form') as HTMLFormElement | null;
    await form!.dispatchEvent(new Event('submit'));
    await flushPromises();

    expect(document.body.querySelector('.auth-form__error')?.textContent).toContain(
      'Ungültige Anmeldedaten.',
    );
    expect(document.body.querySelector('.auth-form__field-error')?.textContent).toContain(
      'Passwort ist falsch.',
    );
    expect(
      document.body.querySelector('#login-password')?.classList.contains('auth-form__input--error'),
    ).toBe(true);

    wrapper.unmount();
  });
});
