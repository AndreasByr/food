<template>
  <div class="page-settings">
    <header class="page-settings__header">
      <h1 class="page-settings__title">Einstellungen</h1>
      <p class="page-settings__subtitle">Profil, Erscheinungsbild und Konto</p>
    </header>

    <section class="page-settings__cards">
      <article class="settings-card">
        <div class="settings-card__avatar">
          <span class="settings-card__avatar-initial">{{ avatarInitial }}</span>
        </div>
        <div class="settings-card__meta">
          <h2 class="settings-card__name">{{ profileName }}</h2>
          <p class="settings-card__email">{{ auth.user?.email }}</p>
        </div>
      </article>

      <article class="settings-card settings-card--row">
        <div class="settings-card__row">
          <span class="settings-card__label">Design</span>
          <span class="settings-card__value">{{ themeLabel }}</span>
        </div>
        <button
          type="button"
          class="settings-card__action settings-card__action--secondary"
          @click="theme.toggle"
        >
          {{ theme.isDark.value ? 'Hell' : 'Dunkel' }} aktivieren
        </button>
      </article>

      <article class="settings-card settings-card--row">
        <button
          type="button"
          class="settings-card__action settings-card__action--danger"
          @click="handleLogout"
        >
          Abmelden
        </button>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' });

const auth = useAuthStore();
const themeStore = useThemeStore();
const theme = useTheme();

const themeLabel = computed(() => (themeStore.isDark ? 'Dunkel' : 'Hell'));
const profileName = computed(() => auth.user?.name ?? auth.user?.email ?? 'Profil');
const avatarInitial = computed(() =>
  profileName.value.charAt(0).toLocaleUpperCase(),
);

async function handleLogout() {
  await auth.logout();
  await navigateTo('/login');
}
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
  border: var(--border-width) solid var(--color-border);
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
  cursor: pointer;
}

.settings-card__action:hover {
  background-color: var(--color-primary-hover);
}

.settings-card__action--secondary {
  color: var(--color-text-on-primary);
  background-color: var(--color-accent);
}

.settings-card__action--secondary:hover {
  background-color: var(--color-accent-hover);
}

.settings-card__action--danger {
  color: var(--color-error);
  background-color: var(--color-surface);
  border: var(--border-width) solid var(--color-error);
}

.settings-card__action--danger:hover {
  background-color: var(--color-surface-alt);
}

.settings-card--row {
  flex-direction: column;
  align-items: stretch;
  gap: var(--space-4);
}
</style>
