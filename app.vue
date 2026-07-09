<template>
  <div class="foodora-root">
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
// Mobile-first SPA shell: NuxtLayout renders the active layout (default for tabs,
// none/full-screen for auth pages), NuxtPage renders the route component.
</script>