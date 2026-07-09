<template>
  <div class="page-settings">
    <header class="page-settings__header">
      <h1 class="page-settings__title">Einstellungen</h1>
      <p class="page-settings__subtitle">Profil, Erscheinungsbild und Konto</p>
    </header>

    <section class="page-settings__cards">
      <article class="settings-card">
        <div class="settings-card__avatar">
          <span class="settings-card__avatar-initial">?</span>
        </div>
        <div class="settings-card__meta">
          <h2 class="settings-card__name">Profil</h2>
          <p class="settings-card__email">Anmeldung folgt in T03</p>
        </div>
      </article>

      <article class="settings-card">
        <div class="settings-card__row">
          <span class="settings-card__label">Design</span>
          <span class="settings-card__value">{{ themeLabel }}</span>
        </div>
      </article>

      <article class="settings-card">
        <button type="button" class="settings-card__action" disabled>
          Abmelden
        </button>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
// T05 will wire profile, theme toggle, and logout to real stores/composables.
// For T02 the page renders the card structure so the shell is visible.
const themeStore = useThemeStore();
const themeLabel = computed(() => (themeStore.isDark ? 'Dunkel' : 'Hell'));
</script>

<style scoped>
.page-settings {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.page-settings__header {
  margin-bottom: var(--space-6);
}

.page-settings__title {
  margin: 0;
  font: var(--text-display);
  color: var(--color-text-primary);
}

.page-settings__subtitle {
  margin: var(--space-1) 0 0;
  font: var(--text-body);
  color: var(--color-text-secondary);
}

.page-settings__cards {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.settings-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--elevation-1);
}

.settings-card__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: var(--space-12);
  height: var(--space-12);
  background-color: var(--color-surface-alt);
  border-radius: var(--radius-full);
}

.settings-card__avatar-initial {
  font: var(--text-h3);
  color: var(--color-text-secondary);
}

.settings-card__meta {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.settings-card__name {
  margin: 0;
  font: var(--text-h3);
  color: var(--color-text-primary);
}

.settings-card__email {
  margin: 0;
  font: var(--text-body-sm);
  color: var(--color-text-secondary);
}

.settings-card__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.settings-card__label {
  font: var(--text-body);
  color: var(--color-text-primary);
}

.settings-card__value {
  font: var(--text-body-sm);
  color: var(--color-text-secondary);
}

.settings-card__action {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  font: var(--text-body);
  color: var(--color-text-on-primary);
  background-color: var(--color-primary);
  border: none;
  border-radius: var(--radius-md);
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
