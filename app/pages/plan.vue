<template>
  <div class="page-plan">
    <header class="page-plan__header">
      <h1 class="page-plan__title">Plan</h1>
      <p class="page-plan__subtitle">Rezepte planen und verwalten</p>
    </header>

    <div
      v-if="recipeStore.error"
      class="page-plan__error"
      role="alert"
      aria-live="polite"
    >
      {{ recipeStore.error }}
      <button
        type="button"
        class="page-plan__error-close"
        aria-label="Fehlermeldung schließen"
        @click="recipeStore.clearError()"
      >
        ×
      </button>
    </div>

    <div class="page-plan__actions">
      <button
        type="button"
        class="page-plan__action page-plan__action--secondary"
        :aria-expanded="showIngredientForm"
        @click="showIngredientForm = !showIngredientForm"
      >
        {{ showIngredientForm ? 'Zutatform schließen' : '+ Neue Zutat' }}
      </button>
      <button
        type="button"
        class="page-plan__action"
        :aria-expanded="showRecipeForm"
        @click="showRecipeForm = !showRecipeForm"
      >
        {{ showRecipeForm ? 'Rezeptform schließen' : '+ Neues Rezept' }}
      </button>
    </div>

    <div v-if="showIngredientForm" class="page-plan__form-card">
      <h2 class="page-plan__form-title">Neue Zutat</h2>
      <IngredientForm @created="onIngredientCreated" />
    </div>

    <div v-if="showRecipeForm" class="page-plan__form-card">
      <h2 class="page-plan__form-title">Neues Rezept</h2>
      <RecipeForm @created="onRecipeCreated" />
    </div>

    <section v-if="recipeStore.recipes.length === 0" class="page-plan__content">
      <EmptyState
        title="Noch keine Rezepte"
        description="Erstelle ein Rezept mit Zutaten, damit es hier erscheint."
      >
        <template #icon>
          <IconPlan />
        </template>
      </EmptyState>
    </section>

    <section v-else class="page-plan__list" aria-label="Deine Rezepte">
      <RecipeCard
        v-for="recipe in recipeStore.recipes"
        :key="recipe.id"
        :recipe="recipe"
        :is-deleting="deletingId === recipe.id"
        @delete="onDelete"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import IconPlan from '~/components/icons/IconPlan.vue';

const recipeStore = useRecipeStore();

const showIngredientForm = ref(false);
const showRecipeForm = ref(false);
const deletingId = ref<string | null>(null);

async function loadData() {
  await Promise.all([
    recipeStore.loadRecipes().catch(() => undefined),
    recipeStore.loadIngredients().catch(() => undefined),
  ]);
}

function onIngredientCreated() {
  showIngredientForm.value = false;
}

function onRecipeCreated() {
  showRecipeForm.value = false;
}

async function onDelete(id: string) {
  deletingId.value = id;
  try {
    await recipeStore.deleteRecipe(id);
  } finally {
    deletingId.value = null;
  }
}

onMounted(() => {
  loadData();
});

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

.page-plan__error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
  padding: var(--space-3) var(--space-4);
  font: var(--text-body-sm);
  color: var(--color-error);
  background-color: var(--color-surface-alt);
  border-left: var(--space-1) solid var(--color-error);
  border-radius: var(--radius-sm);
}

.page-plan__error-close {
  flex: 0 0 auto;
  width: var(--space-8);
  height: var(--space-8);
  font: var(--text-body);
  color: var(--color-error);
  background-color: transparent;
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
}

.page-plan__actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.page-plan__action {
  padding: var(--space-3) var(--space-4);
  font: var(--text-body);
  font-weight: 600;
  color: var(--color-text-on-primary);
  text-align: center;
  text-decoration: none;
  background-color: var(--color-primary);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
}

.page-plan__action--secondary {
  color: var(--color-primary);
  background-color: var(--color-surface);
  border: var(--border-width) solid var(--color-border);
}

.page-plan__action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-plan__form-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
  padding: var(--space-4);
  background-color: var(--color-surface);
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--elevation-1);
}

.page-plan__form-title {
  margin: 0;
  font: var(--text-h2);
  color: var(--color-text-primary);
}

.page-plan__content {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.page-plan__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
</style>
