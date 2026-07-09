<template>
  <div class="page-plan">
    <header class="page-plan__header">
      <h1 class="page-plan__title">Plan</h1>
      <p class="page-plan__subtitle">Rezepte planen und verwalten</p>
    </header>

    <section class="page-plan__content">
      <EmptyState
        title="Planung folgt"
        description="Hier entsteht die Rezept-Verwaltung. Speichere eigene Rezepte mit Zutaten und Nährwerten."
      >
        <template #icon>
          <IconPlan />
        </template>
      </EmptyState>
    </section>
  </div>
</template>

<script setup lang="ts">
import IconPlan from '~/components/icons/IconPlan.vue';

definePageMeta({ middleware: 'auth' });
</script>

<style scoped>
.page-plan {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.page-plan__header {
  margin-bottom: var(--space-6);
}

.page-plan__title {
  margin: 0;
  font: var(--text-display);
  color: var(--color-text-primary);
}

.page-plan__subtitle {
  margin: var(--space-1) 0 0;
  font: var(--text-body);
  color: var(--color-text-secondary);
}

.page-plan__content {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
</style>
