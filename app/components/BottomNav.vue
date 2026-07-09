<template>
  <nav class="bottom-nav" aria-label="Hauptnavigation">
    <NuxtLink
      v-for="item in tabs"
      :key="item.path"
      :to="item.path"
      class="bottom-nav__tab"
      :class="{ 'bottom-nav__tab--active': isActive(item.path) }"
      :aria-current="isActive(item.path) ? 'page' : undefined"
    >
      <span class="bottom-nav__icon" aria-hidden="true">
        <component :is="item.icon" />
      </span>
      <span class="bottom-nav__label">{{ item.label }}</span>
    </NuxtLink>
  </nav>
</template>

<script setup lang="ts">
import IconToday from './icons/IconToday.vue';
import IconPlan from './icons/IconPlan.vue';
import IconList from './icons/IconList.vue';
import IconStorage from './icons/IconStorage.vue';
import IconSettings from './icons/IconSettings.vue';

const route = useRoute();

interface Tab {
  path: string;
  label: string;
  icon: typeof IconToday;
}

const tabs: Tab[] = [
  { path: '/', label: 'Heute', icon: IconToday },
  { path: '/plan', label: 'Plan', icon: IconPlan },
  { path: '/liste', label: 'Liste', icon: IconList },
  { path: '/lager', label: 'Lager', icon: IconStorage },
  { path: '/einstellungen', label: 'Einstellungen', icon: IconSettings },
];

function isActive(path: string): boolean {
  if (path === '/') {
    return route.path === '/';
  }
  return route.path === path || route.path.startsWith(`${path}/`);
}
</script>

<style scoped>
.bottom-nav {
  display: flex;
  align-items: center;
  justify-content: space-around;
  height: calc(var(--space-16) + env(safe-area-inset-bottom));
  padding-bottom: env(safe-area-inset-bottom);
  background-color: var(--color-surface);
  border-top: var(--border-width) solid var(--color-border);
  box-shadow: var(--elevation-2);
}

.bottom-nav__tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  min-width: var(--space-12);
  min-height: var(--space-12);
  padding: var(--space-2) var(--space-1);
  color: var(--color-icon-inactive);
  text-decoration: none;
  border-radius: var(--radius-md);
  transition: color 150ms ease;
}

.bottom-nav__tab:hover,
.bottom-nav__tab:focus-visible {
  color: var(--color-text-primary);
  outline: none;
  box-shadow: inset 0 0 0 var(--space-1) var(--color-border);
}

.bottom-nav__tab--active,
.bottom-nav__tab--active:hover,
.bottom-nav__tab--active:focus-visible {
  color: var(--color-primary);
  box-shadow: none;
}

.bottom-nav__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--space-6);
  height: var(--space-6);
}

.bottom-nav__label {
  font: var(--text-caption);
}
</style>
