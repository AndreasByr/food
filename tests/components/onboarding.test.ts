import { describe, expect, it } from 'vitest';
import { flushPromises } from '@vue/test-utils';

import OnboardingBarrier from '~/components/OnboardingBarrier.vue';
import { mountWithPinia } from './test-utils';

describe('OnboardingBarrier', () => {
  it('renders the eating-disorder warning when the user has not acknowledged it', async () => {
    const wrapper = mountWithPinia(OnboardingBarrier);
    await flushPromises();

    const sheet = document.body.querySelector('.onboarding-barrier__sheet');
    expect(sheet).not.toBeNull();
    expect(sheet?.textContent).toContain('Essstörung');

    wrapper.unmount();
  });

  it('keeps the confirm button disabled until the checkbox is checked', async () => {
    const wrapper = mountWithPinia(OnboardingBarrier);
    await flushPromises();

    const confirm = document.body.querySelector(
      '.onboarding-barrier__confirm',
    ) as HTMLButtonElement | null;
    expect(confirm?.disabled).toBe(true);

    const checkbox = document.body.querySelector(
      '.onboarding-barrier__checkbox',
    ) as HTMLInputElement | null;
    checkbox!.checked = true;
    await checkbox!.dispatchEvent(new Event('change'));
    await flushPromises();

    expect(confirm?.disabled).toBe(false);

    wrapper.unmount();
  });

  it('dismisses the barrier and persists the acknowledgement on confirm', async () => {
    const wrapper = mountWithPinia(OnboardingBarrier);
    await flushPromises();

    const checkbox = document.body.querySelector(
      '.onboarding-barrier__checkbox',
    ) as HTMLInputElement | null;
    checkbox!.checked = true;
    await checkbox!.dispatchEvent(new Event('change'));
    await flushPromises();

    const confirm = document.body.querySelector(
      '.onboarding-barrier__confirm',
    ) as HTMLButtonElement | null;
    await confirm!.click();
    await flushPromises();

    expect(document.body.querySelector('.onboarding-barrier__sheet')).toBeNull();
    expect(localStorage.getItem('foodora-onboarding')).toBe('true');

    wrapper.unmount();
  });

  it('does not render when the user has already acknowledged', async () => {
    localStorage.setItem('foodora-onboarding', 'true');
    const wrapper = mountWithPinia(OnboardingBarrier);
    await flushPromises();

    expect(document.body.querySelector('.onboarding-barrier__sheet')).toBeNull();

    wrapper.unmount();
  });
});
