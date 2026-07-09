<template>
  <div class="auth-page">
    <div class="auth-page__card">
      <header class="auth-page__header">
        <h1 class="auth-page__title">Anmelden</h1>
        <p class="auth-page__subtitle">Melde dich an, um deine Pläne zu synchronisieren.</p>
      </header>

      <form class="auth-form" @submit.prevent="onSubmit">
        <div class="auth-form__field">
          <label for="login-email" class="auth-form__label">E-Mail</label>
          <input
            id="login-email"
            v-model="email"
            type="email"
            class="auth-form__input"
            placeholder="name@beispiel.de"
            autocomplete="email"
            required
          />
        </div>

        <div class="auth-form__field">
          <label for="login-password" class="auth-form__label">Passwort</label>
          <input
            id="login-password"
            v-model="password"
            type="password"
            class="auth-form__input"
            placeholder="Passwort"
            autocomplete="current-password"
            required
          />
        </div>

        <button type="submit" class="auth-form__submit" :disabled="!canSubmit">
          Anmelden
        </button>
      </form>

      <footer class="auth-page__footer">
        <NuxtLink to="/register" class="auth-page__link">
          Noch kein Konto? Registrieren
        </NuxtLink>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
// T03 will wire this form to the auth store and API client.
// T02 only provides the visual shell and client-side validation skeleton.
definePageMeta({
  layout: false,
});

const email = ref('');
const password = ref('');

const canSubmit = computed(() => email.value.length > 0 && password.value.length > 0);

function onSubmit() {
  // Placeholder for T03 integration.
  // eslint-disable-next-line no-console
  console.warn('Login not yet wired to auth store (T03).');
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
  border: 1px solid var(--color-border);
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
  border: 1px solid var(--color-border);
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
</style>
