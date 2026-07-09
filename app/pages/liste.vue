<template>
  <div class="page-liste">
    <header class="page-liste__header">
      <h1 class="page-liste__title">Liste</h1>
      <p class="page-liste__subtitle">Deine Einkaufsliste</p>
    </header>

    <EmptyState
      title="Liste ist leer"
      description="Sobald du Rezepte planst, werden die benötigten Zutaten hier gesammelt."
    >
      <template #icon>
        <IconList />
      </template>
    </EmptyState>
  </div>
</template>

<script setup lang="ts">
import IconList from '~/components/icons/IconList.vue';
</script>

<style scoped>
.page-liste {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.page-liste__header {
  margin-bottom: var(--space-6);
}

.page-liste__title {
  margin: 0;
  font: var(--text-display);
  color: var(--color-text-primary);
}

.page-liste__subtitle {
  margin: var(--space-1) 0 0;
  font: var(--text-body);
  color: var(--color-text-secondary);
}
</style>
