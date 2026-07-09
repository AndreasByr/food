<template>
  <article class="recipe-card" :aria-label="recipe.name">
    <div class="recipe-card__header">
      <div class="recipe-card__titles">
        <h2 class="recipe-card__name">{{ recipe.name }}</h2>
        <span v-if="recipe.category" class="recipe-card__category">{{ recipe.category }}</span>
      </div>
      <button
        type="button"
        class="recipe-card__delete"
        :disabled="isDeleting"
        :aria-label="`Rezept ${recipe.name} löschen`"
        @click="onDelete"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v10zM18 4h-2.18c-.2-.6-.76-1-1.4-1h-4.84c-.64 0-1.2.4-1.4 1H6c-.55 0-1 .45-1 1s.45 1 1 1h12c.55 0 1-.45 1-1s-.45-1-1-1z"
          />
        </svg>
      </button>
    </div>

    <p v-if="recipe.description" class="recipe-card__description">
      {{ recipe.description }}
    </p>

    <div v-if="macros" class="recipe-card__macros" aria-label="Nährwerte">
      <div class="macro">
        <span class="macro__value">{{ formatted.kcal }}</span>
        <span class="macro__label">kcal</span>
      </div>
      <div class="macro">
        <span class="macro__value">{{ formatted.protein }}g</span>
        <span class="macro__label">Protein</span>
      </div>
      <div class="macro">
        <span class="macro__value">{{ formatted.fat }}g</span>
        <span class="macro__label">Fett</span>
      </div>
      <div class="macro">
        <span class="macro__value">{{ formatted.carbs }}g</span>
        <span class="macro__label">Kohlenhydrate</span>
      </div>
    </div>

    <div class="recipe-card__meta">
      <span class="recipe-card__servings">{{ recipe.servings }} Portionen</span>
      <span v-if="ingredientCount > 0" class="recipe-card__ingredients">
        {{ ingredientCount }} Zutaten
      </span>
      <span v-if="recipe.isVegan" class="recipe-card__badge">Vegan</span>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { RecipeDetail, RecipeSummary } from '~/stores/recipes';

const props = defineProps<{
  recipe: RecipeSummary | RecipeDetail;
  isDeleting?: boolean;
}>();

const emit = defineEmits<{
  delete: [id: string];
}>();

const macros = computed(() => {
  if ('macros' in props.recipe) {
    const detail = props.recipe as RecipeDetail;
    return detail.macros;
  }
  return null;
});

const ingredientCount = computed(() => {
  if ('ingredients' in props.recipe) {
    return (props.recipe as RecipeDetail).ingredients.length;
  }
  return 0;
});

const perServing = computed(() => {
  if (!macros.value) return null;
  const s = props.recipe.servings || 1;
  return {
    kcal: macros.value.kcal / s,
    protein: macros.value.protein / s,
    fat: macros.value.fat / s,
    carbs: macros.value.carbs / s,
  };
});

const formatted = computed(() => {
  const m = perServing.value ?? { kcal: 0, protein: 0, fat: 0, carbs: 0 };
  return {
    kcal: Math.round(m.kcal),
    protein: m.protein.toFixed(1),
    fat: m.fat.toFixed(1),
    carbs: m.carbs.toFixed(1),
  };
});

function onDelete() {
  emit('delete', props.recipe.id);
}
</script>

<style scoped>
.recipe-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-4);
  background-color: var(--color-surface);
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--elevation-1);
}

.recipe-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
}

.recipe-card__titles {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.recipe-card__name {
  margin: 0;
  font: var(--text-h3);
  color: var(--color-text-primary);
  word-break: break-word;
}

.recipe-card__category {
  align-self: flex-start;
  padding: var(--space-1) var(--space-2);
  font: var(--text-caption);
  color: var(--color-text-secondary);
  background-color: var(--color-surface-alt);
  border-radius: var(--radius-sm);
}

.recipe-card__delete {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--space-10);
  height: var(--space-10);
  padding: 0;
  color: var(--color-error);
  background-color: transparent;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
}

.recipe-card__delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.recipe-card__delete svg {
  width: var(--space-6);
  height: var(--space-6);
  fill: currentColor;
}

.recipe-card__description {
  margin: 0;
  font: var(--text-body-sm);
  color: var(--color-text-secondary);
}

.recipe-card__macros {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-3);
  padding: var(--space-3);
  background-color: var(--color-surface-alt);
  border-radius: var(--radius-md);
}

.macro {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
}

.macro__value {
  font: var(--text-data-sm);
  color: var(--color-text-primary);
}

.macro__label {
  font: var(--text-caption);
  color: var(--color-text-secondary);
  text-align: center;
}

.recipe-card__meta {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font: var(--text-caption);
  color: var(--color-text-secondary);
}

.recipe-card__badge {
  padding: var(--space-1) var(--space-2);
  color: var(--color-text-on-primary);
  background-color: var(--color-accent);
  border-radius: var(--radius-sm);
}
</style>
