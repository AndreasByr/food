<template>
  <div class="page-lager">
    <header class="page-lager__header">
      <h1 class="page-lager__title">Lager</h1>
      <p class="page-lager__subtitle">Vorräte im Blick</p>
    </header>

    <EmptyState
      title="Lager ist leer"
      description="Hier erscheinen später deine vorhandenen Zutaten und ihre Mengen."
    >
      <template #icon>
        <IconStorage />
      </template>
    </EmptyState>
  </div>
</template>

<script setup lang="ts">
import IconStorage from '~/components/icons/IconStorage.vue';

definePageMeta({ middleware: 'auth' });
</script>

<style scoped>
.page-lager {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.page-lager__header {
  margin-bottom: var(--space-6);
}

.page-lager__title {
  margin: 0;
  font: var(--text-display);
  color: var(--color-text-primary);
}

.page-lager__subtitle {
  margin: var(--space-1) 0 0;
  font: var(--text-body);
  color: var(--color-text-secondary);
}
</style>
