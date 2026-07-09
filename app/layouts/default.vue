<template>
  <div class="app-shell">
    <main class="app-shell__main">
      <slot />
    </main>
    <BottomNav class="app-shell__nav" />
  </div>
</template>

<script setup lang="ts">
// Default mobile-first layout: scrollable main area + fixed bottom tab bar.
// All protected tab pages use this layout; auth pages set `layout: false`.
</script>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-height: 100dvh;
  background-color: var(--color-background);
  color: var(--color-text-primary);
}

.app-shell__main {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: var(--space-4);
  padding-bottom: calc(var(--space-16) + env(safe-area-inset-bottom) + var(--space-4));
}

.app-shell__nav {
  flex: 0 0 auto;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 50;
}
</style>
