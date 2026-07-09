<template>
  <Teleport to="body">
    <div
      v-if="showBarrier"
      class="onboarding-barrier"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div class="onboarding-barrier__backdrop" />
      <div class="onboarding-barrier__sheet">
        <h1 id="onboarding-title" class="onboarding-barrier__title">
          Wichtiger Hinweis
        </h1>

        <p class="onboarding-barrier__body">
          Foodora ist ein Werkzeug zur Unterstützung einer ausgewogenen Ernährung.
          Es ersetzt keine medizinische Beratung und ist nicht für die Behandlung
          von Essstörungen gedacht.
        </p>
        <p class="onboarding-barrier__body onboarding-barrier__body--emphasis">
          Wenn du unter einer Essstörung leidest oder im Verdacht stehst, such
          bitte professionelle Hilfe, bevor du diese App nutzt.
        </p>

        <label class="onboarding-barrier__acknowledgment">
          <input
            v-model="acknowledged"
            type="checkbox"
            class="onboarding-barrier__checkbox"
          />
          <span class="onboarding-barrier__acknowledgment-text">
            Ich habe den Hinweis verstanden und möchte trotzdem fortfahren.
          </span>
        </label>

        <button
          type="button"
          class="onboarding-barrier__confirm"
          :disabled="!acknowledged"
          @click="confirm"
        >
          Verstanden – App öffnen
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const onboarding = useOnboarding();
const acknowledged = ref(false);

const showBarrier = computed(() => onboarding.isReady.value && !onboarding.isOnboarded.value);

function confirm() {
  if (!acknowledged.value) return;
  onboarding.complete();
}
</script>

<style scoped>
.onboarding-barrier {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.onboarding-barrier__backdrop {
  position: absolute;
  inset: 0;
  background-color: var(--neutral-1000);
  opacity: 0.6;
}

.onboarding-barrier__sheet {
  position: relative;
  width: 100%;
  margin: var(--space-4);
  padding: var(--space-5);
  background-color: var(--color-surface);
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--elevation-2);
}

.onboarding-barrier__title {
  margin: 0 0 var(--space-4);
  font: var(--text-h2);
  color: var(--color-error);
}

.onboarding-barrier__body {
  margin: 0 0 var(--space-4);
  font: var(--text-body);
  color: var(--color-text-primary);
}

.onboarding-barrier__body--emphasis {
  padding: var(--space-3);
  background-color: var(--color-surface-alt);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
}

.onboarding-barrier__acknowledgment {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  margin-bottom: var(--space-5);
  cursor: pointer;
}

.onboarding-barrier__checkbox {
  flex: 0 0 auto;
  width: var(--space-5);
  height: var(--space-5);
  margin: 0;
  accent-color: var(--color-accent);
  cursor: pointer;
}

.onboarding-barrier__acknowledgment-text {
  font: var(--text-body);
  color: var(--color-text-primary);
}

.onboarding-barrier__confirm {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  font: var(--text-body);
  color: var(--color-text-on-primary);
  background-color: var(--color-primary);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
}

.onboarding-barrier__confirm:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
}

.onboarding-barrier__confirm:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
