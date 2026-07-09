<template>
  <section class="empty-state" :aria-label="title">
    <div class="empty-state__card">
      <div v-if="$slots.icon" class="empty-state__icon">
        <slot name="icon" />
      </div>
      <h2 class="empty-state__title">{{ title }}</h2>
      <p class="empty-state__description">{{ description }}</p>
      <div v-if="$slots.action" class="empty-state__action">
        <slot name="action" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  description: string;
}>();
</script>

<style scoped>
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: var(--space-4);
}

.empty-state__card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  width: 100%;
  max-width: 20rem;
  padding: var(--space-8) var(--space-6);
  text-align: center;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--elevation-1);
}

.empty-state__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--space-12);
  height: var(--space-12);
  color: var(--color-icon-inactive);
}

.empty-state__title {
  margin: 0;
  font: var(--text-h2);
  color: var(--color-text-primary);
}

.empty-state__description {
  margin: 0;
  font: var(--text-body);
  color: var(--color-text-secondary);
}

.empty-state__action {
  margin-top: var(--space-2);
}
</style>
