<template>
  <form class="ingredient-form" @submit.prevent="onSubmit">
    <div
      v-if="formError?.message"
      class="ingredient-form__error"
      role="alert"
      aria-live="polite"
    >
      {{ formError.message }}
    </div>

    <div class="ingredient-form__field">
      <label for="ingredient-name" class="ingredient-form__label">Name *</label>
      <input
        id="ingredient-name"
        v-model="name"
        type="text"
        class="ingredient-form__input"
        :class="{ 'ingredient-form__input--error': !!formError?.fields.name }"
        placeholder="z. B. Linsen (getrocknet)"
        required
        maxlength="120"
      />
      <p v-if="formError?.fields.name" class="ingredient-form__field-error">
        {{ formError.fields.name }}
      </p>
    </div>

    <div class="ingredient-form__field ingredient-form__field--inline">
      <div class="ingredient-form__inline-field">
        <label for="ingredient-unit" class="ingredient-form__label">Standard-Einheit</label>
        <input
          id="ingredient-unit"
          v-model="defaultUnit"
          type="text"
          class="ingredient-form__input"
          placeholder="g"
          maxlength="20"
        />
      </div>
    </div>

    <fieldset class="ingredient-form__macros">
      <legend class="ingredient-form__legend">Nährwerte pro 100 g</legend>

      <div class="ingredient-form__macro-field">
        <label for="ingredient-kcal" class="ingredient-form__label">kcal *</label>
        <input
          id="ingredient-kcal"
          v-model.number="kcalPer100g"
          type="number"
          min="0"
          step="any"
          class="ingredient-form__input"
          :class="{ 'ingredient-form__input--error': !!formError?.fields.kcalPer100g }"
          required
        />
      </div>

      <div class="ingredient-form__macro-field">
        <label for="ingredient-protein" class="ingredient-form__label">Protein (g) *</label>
        <input
          id="ingredient-protein"
          v-model.number="proteinPer100g"
          type="number"
          min="0"
          step="any"
          class="ingredient-form__input"
          :class="{ 'ingredient-form__input--error': !!formError?.fields.proteinPer100g }"
          required
        />
      </div>

      <div class="ingredient-form__macro-field">
        <label for="ingredient-fat" class="ingredient-form__label">Fett (g) *</label>
        <input
          id="ingredient-fat"
          v-model.number="fatPer100g"
          type="number"
          min="0"
          step="any"
          class="ingredient-form__input"
          :class="{ 'ingredient-form__input--error': !!formError?.fields.fatPer100g }"
          required
        />
      </div>

      <div class="ingredient-form__macro-field">
        <label for="ingredient-carbs" class="ingredient-form__label">Kohlenhydrate (g) *</label>
        <input
          id="ingredient-carbs"
          v-model.number="carbsPer100g"
          type="number"
          min="0"
          step="any"
          class="ingredient-form__input"
          :class="{ 'ingredient-form__input--error': !!formError?.fields.carbsPer100g }"
          required
        />
      </div>
    </fieldset>

    <button
      type="submit"
      class="ingredient-form__submit"
      :disabled="isSubmitting || !canSubmit"
    >
      {{ isSubmitting ? 'Wird gespeichert...' : 'Zutat speichern' }}
    </button>
  </form>
</template>

<script setup lang="ts">
import type { CreateIngredientPayload, Ingredient } from '~/stores/recipes';

const recipeStore = useRecipeStore();

const emit = defineEmits<{
  created: [ingredient: Ingredient];
}>();

const name = ref('');
const defaultUnit = ref('g');
const kcalPer100g = ref(0);
const proteinPer100g = ref(0);
const fatPer100g = ref(0);
const carbsPer100g = ref(0);
const isSubmitting = ref(false);
const formError = ref<ReturnType<typeof parseApiError> | null>(null);

const canSubmit = computed(() => {
  if (isSubmitting.value) return false;
  return (
    name.value.trim().length > 0 &&
    defaultUnit.value.trim().length > 0 &&
    Number.isFinite(kcalPer100g.value) &&
    Number.isFinite(proteinPer100g.value) &&
    Number.isFinite(fatPer100g.value) &&
    Number.isFinite(carbsPer100g.value)
  );
});

async function onSubmit() {
  if (isSubmitting.value || !canSubmit.value) return;

  formError.value = null;
  isSubmitting.value = true;

  const payload: CreateIngredientPayload = {
    name: name.value.trim(),
    defaultUnit: defaultUnit.value.trim() || 'g',
    kcalPer100g: kcalPer100g.value,
    proteinPer100g: proteinPer100g.value,
    fatPer100g: fatPer100g.value,
    carbsPer100g: carbsPer100g.value,
  };

  try {
    const ingredient = await recipeStore.createIngredient(payload);
    reset();
    emit('created', ingredient);
  } catch (error) {
    formError.value = parseApiError(error);
  } finally {
    isSubmitting.value = false;
  }
}

function reset() {
  name.value = '';
  defaultUnit.value = 'g';
  kcalPer100g.value = 0;
  proteinPer100g.value = 0;
  fatPer100g.value = 0;
  carbsPer100g.value = 0;
  formError.value = null;
}
</script>

<style scoped>
.ingredient-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.ingredient-form__error {
  padding: var(--space-3) var(--space-4);
  font: var(--text-body-sm);
  color: var(--color-error);
  background-color: var(--color-surface-alt);
  border-left: var(--space-1) solid var(--color-error);
  border-radius: var(--radius-sm);
}

.ingredient-form__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.ingredient-form__field--inline {
  flex-direction: row;
  gap: var(--space-4);
}

.ingredient-form__inline-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  flex: 1 1 auto;
}

.ingredient-form__label {
  font: var(--text-caption);
  color: var(--color-text-primary);
}

.ingredient-form__input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  font: var(--text-body);
  color: var(--color-text-primary);
  background-color: var(--color-surface-alt);
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--radius-md);
}

.ingredient-form__input::placeholder {
  color: var(--color-text-secondary);
}

.ingredient-form__input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.ingredient-form__input--error {
  border-color: var(--color-error);
}

.ingredient-form__field-error {
  margin: 0;
  font: var(--text-caption);
  color: var(--color-error);
}

.ingredient-form__macros {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
  margin: 0;
  padding: var(--space-4);
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--radius-md);
}

.ingredient-form__legend {
  padding: 0 var(--space-2);
  font: var(--text-caption);
  color: var(--color-text-primary);
}

.ingredient-form__macro-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.ingredient-form__submit {
  padding: var(--space-3) var(--space-4);
  font: var(--text-body);
  font-weight: 600;
  color: var(--color-text-on-primary);
  background-color: var(--color-primary);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
}

.ingredient-form__submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ingredient-form__submit:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
}
</style>
