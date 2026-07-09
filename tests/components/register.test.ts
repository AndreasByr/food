import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';

import RegisterPage from '~/pages/register.vue';
import { useAuthStore } from '~/stores/auth';
import { mountWithPinia } from './test-utils';

describe('RegisterPage', () => {
  it('renders the register form with name, email and password fields', async () => {
    const wrapper = mountWithPinia(RegisterPage);
    await flushPromises();

    expect(document.body.querySelector('h1')?.textContent).toContain('Registrieren');
    expect(document.body.querySelector('#register-name')).not.toBeNull();
    expect(document.body.querySelector('#register-email')).not.toBeNull();
    expect(document.body.querySelector('#register-password')).not.toBeNull();

    wrapper.unmount();
  });

  it('keeps the submit button disabled until email is set and password has 8+ chars', async () => {
    const wrapper = mountWithPinia(RegisterPage);
    await flushPromises();

    const submit = document.body.querySelector('.auth-form__submit') as HTMLButtonElement | null;
    expect(submit?.disabled).toBe(true);

    const email = document.body.querySelector('#register-email') as HTMLInputElement | null;
    email!.value = 'new@example.com';
    await email!.dispatchEvent(new Event('input'));
    await flushPromises();
    expect(submit?.disabled).toBe(true);

    const password = document.body.querySelector('#register-password') as HTMLInputElement | null;
    password!.value = 'short';
    await password!.dispatchEvent(new Event('input'));
    await flushPromises();
    expect(submit?.disabled).toBe(true);

    password!.value = 'password123';
    await password!.dispatchEvent(new Event('input'));
    await flushPromises();
    expect(submit?.disabled).toBe(false);

    wrapper.unmount();
  });

  it('calls auth.register and navigates to home on successful submit', async () => {
    const wrapper = mountWithPinia(RegisterPage);
    await flushPromises();

    const auth = useAuthStore();
    vi.spyOn(auth, 'register').mockResolvedValue({
      user: { id: '2', email: 'new@example.com', name: 'New', createdAt: new Date().toISOString() },
      accessToken: 'access',
      refreshToken: 'refresh',
    });

    const name = document.body.querySelector('#register-name') as HTMLInputElement | null;
    name!.value = 'New User';
    await name!.dispatchEvent(new Event('input'));

    const email = document.body.querySelector('#register-email') as HTMLInputElement | null;
    email!.value = 'new@example.com';
    await email!.dispatchEvent(new Event('input'));

    const password = document.body.querySelector('#register-password') as HTMLInputElement | null;
    password!.value = 'password123';
    await password!.dispatchEvent(new Event('input'));
    await flushPromises();

    const form = document.body.querySelector('.auth-form') as HTMLFormElement | null;
    await form!.dispatchEvent(new Event('submit'));
    await flushPromises();

    expect(auth.register).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'password123',
      name: 'New User',
    });
    expect(navigateTo).toHaveBeenCalledWith('/');

    wrapper.unmount();
  });

  it('renders field-level errors on failed registration', async () => {
    const wrapper = mountWithPinia(RegisterPage);
    await flushPromises();

    const auth = useAuthStore();
    const error = {
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: {
        statusCode: 400,
        message: 'Registrierung fehlgeschlagen.',
        errors: { email: ['E-Mail wird bereits verwendet.'] },
      },
    };
    vi.spyOn(auth, 'register').mockRejectedValue(error);

    const email = document.body.querySelector('#register-email') as HTMLInputElement | null;
    email!.value = 'taken@example.com';
    await email!.dispatchEvent(new Event('input'));

    const password = document.body.querySelector('#register-password') as HTMLInputElement | null;
    password!.value = 'password123';
    await password!.dispatchEvent(new Event('input'));
    await flushPromises();

    const form = document.body.querySelector('.auth-form') as HTMLFormElement | null;
    await form!.dispatchEvent(new Event('submit'));
    await flushPromises();

    expect(document.body.querySelector('.auth-form__error')?.textContent).toContain(
      'Registrierung fehlgeschlagen.',
    );
    expect(document.body.querySelector('.auth-form__field-error')?.textContent).toContain(
      'E-Mail wird bereits verwendet.',
    );

    wrapper.unmount();
  });
});
