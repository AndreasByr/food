<template>
  <div class="page-heute">
    <header class="page-heute__header">
      <h1 class="page-heute__title">Heute</h1>
      <p class="page-heute__subtitle">Dein Tages-Überblick</p>
    </header>

    <EmptyState
      title="Noch nichts geplant"
      description="Heute gibt es noch keine Mahlzeiten im Plan. Füge im Plan-Tab Rezepte hinzu."
    >
      <template #icon>
        <IconToday />
      </template>
    </EmptyState>
  </div>
</template>

<script setup lang="ts">
import IconToday from '~/components/icons/IconToday.vue';
</script>

<style scoped>
.page-heute {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.page-heute__header {
  margin-bottom: var(--space-6);
}

.page-heute__title {
  margin: 0;
  font: var(--text-display);
  color: var(--color-text-primary);
}

.page-heute__subtitle {
  margin: var(--space-1) 0 0;
  font: var(--text-body);
  color: var(--color-text-secondary);
}
</style>
