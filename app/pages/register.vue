<template>
  <div class="auth-page">
    <div class="auth-page__card">
      <header class="auth-page__header">
        <h1 class="auth-page__title">Registrieren</h1>
        <p class="auth-page__subtitle">Erstelle ein Konto, um Foodora zu nutzen.</p>
      </header>

      <div
        v-if="formError?.message"
        class="auth-form__error"
        role="alert"
        aria-live="polite"
      >
        {{ formError.message }}
      </div>

      <form class="auth-form" @submit.prevent="onSubmit">
        <div class="auth-form__field">
          <label for="register-name" class="auth-form__label">Name (optional)</label>
          <input
            id="register-name"
            v-model="name"
            type="text"
            class="auth-form__input"
            :class="{ 'auth-form__input--error': !!formError?.fields.name }"
            placeholder="Max"
            autocomplete="name"
          />
          <p v-if="formError?.fields.name" class="auth-form__field-error">
            {{ formError.fields.name }}
          </p>
        </div>

        <div class="auth-form__field">
          <label for="register-email" class="auth-form__label">E-Mail</label>
          <input
            id="register-email"
            v-model="email"
            type="email"
            class="auth-form__input"
            :class="{ 'auth-form__input--error': !!formError?.fields.email }"
            placeholder="name@beispiel.de"
            autocomplete="email"
            required
          />
          <p v-if="formError?.fields.email" class="auth-form__field-error">
            {{ formError.fields.email }}
          </p>
        </div>

        <div class="auth-form__field">
          <label for="register-password" class="auth-form__label">Passwort</label>
          <input
            id="register-password"
            v-model="password"
            type="password"
            class="auth-form__input"
            :class="{ 'auth-form__input--error': !!formError?.fields.password }"
            placeholder="Mindestens 8 Zeichen"
            autocomplete="new-password"
            minlength="8"
            required
          />
          <p v-if="formError?.fields.password" class="auth-form__field-error">
            {{ formError.fields.password }}
          </p>
        </div>

        <button
          type="submit"
          class="auth-form__submit"
          :disabled="isSubmitting || !canSubmit"
        >
          {{ isSubmitting ? 'Konto wird erstellt...' : 'Konto erstellen' }}
        </button>
      </form>

      <footer class="auth-page__footer">
        <NuxtLink to="/login" class="auth-page__link">
          Bereits ein Konto? Anmelden
        </NuxtLink>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
const auth = useAuthStore();

definePageMeta({
  layout: false,
});

const name = ref('');
const email = ref('');
const password = ref('');
const isSubmitting = ref(false);
const formError = ref<ReturnType<typeof parseApiError> | null>(null);

const canSubmit = computed(
  () =>
    email.value.length > 0 &&
    password.value.length >= 8 &&
    !isSubmitting.value,
);

async function onSubmit() {
  if (isSubmitting.value || !canSubmit.value) return;

  formError.value = null;
  isSubmitting.value = true;

  try {
    await auth.register({
      email: email.value,
      password: password.value,
      name: name.value.trim() || undefined,
    });
    await navigateTo('/');
  } catch (error) {
    formError.value = parseApiError(error);
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<style scoped>
.auth-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  min-height: 100dvh;
  padding: var(--space-4);
  background-color: var(--color-background);
}

.auth-page__card {
  width: 100%;
  max-width: 22rem;
  padding: var(--space-6);
  background-color: var(--color-surface);
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--elevation-2);
}

.auth-page__header {
  margin-bottom: var(--space-6);
  text-align: center;
}

.auth-page__title {
  margin: 0;
  font: var(--text-h1);
  color: var(--color-text-primary);
}

.auth-page__subtitle {
  margin: var(--space-2) 0 0;
  font: var(--text-body-sm);
  color: var(--color-text-secondary);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.auth-form__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.auth-form__label {
  font: var(--text-caption);
  color: var(--color-text-primary);
}

.auth-form__input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  font: var(--text-body);
  color: var(--color-text-primary);
  background-color: var(--color-surface-alt);
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--radius-md);
}

.auth-form__input::placeholder {
  color: var(--color-text-secondary);
}

.auth-form__input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.auth-form__submit {
  margin-top: var(--space-2);
  padding: var(--space-3) var(--space-4);
  font: var(--text-body);
  font-weight: 600;
  color: var(--color-text-on-primary);
  background-color: var(--color-primary);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
}

.auth-form__submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.auth-form__submit:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
}

.auth-page__footer {
  margin-top: var(--space-6);
  text-align: center;
}

.auth-page__link {
  font: var(--text-body-sm);
  color: var(--color-accent);
  text-decoration: none;
}

.auth-page__link:hover {
  color: var(--color-accent-hover);
  text-decoration: underline;
}

.auth-form__error {
  margin-bottom: var(--space-4);
  padding: var(--space-3) var(--space-4);
  font: var(--text-body-sm);
  color: var(--color-error);
  background-color: var(--color-surface-alt);
  border-left: var(--space-1) solid var(--color-error);
  border-radius: var(--radius-sm);
}

.auth-form__field-error {
  margin: 0;
  font: var(--text-caption);
  color: var(--color-error);
}

.auth-form__input--error {
  border-color: var(--color-error);
}
</style>
