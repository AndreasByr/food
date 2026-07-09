<template>
  <form class="recipe-form" @submit.prevent="onSubmit">
    <div
      v-if="formError?.message"
      class="recipe-form__error"
      role="alert"
      aria-live="polite"
    >
      {{ formError.message }}
    </div>

    <div class="recipe-form__field">
      <label for="recipe-name" class="recipe-form__label">Rezeptname *</label>
      <input
        id="recipe-name"
        v-model="name"
        type="text"
        class="recipe-form__input"
        :class="{ 'recipe-form__input--error': !!formError?.fields.name }"
        placeholder="z. B. Linsen-Dal"
        required
        maxlength="200"
      />
      <p v-if="formError?.fields.name" class="recipe-form__field-error">
        {{ formError.fields.name }}
      </p>
    </div>

    <div class="recipe-form__field">
      <label for="recipe-category" class="recipe-form__label">Kategorie</label>
      <input
        id="recipe-category"
        v-model="category"
        type="text"
        class="recipe-form__input"
        placeholder="z. B. Hauptgericht"
        maxlength="50"
      />
    </div>

    <div class="recipe-form__field recipe-form__field--inline">
      <div class="recipe-form__inline-field">
        <label for="recipe-servings" class="recipe-form__label">Portionen *</label>
        <input
          id="recipe-servings"
          v-model.number="servings"
          type="number"
          min="1"
          max="100"
          class="recipe-form__input"
          :class="{ 'recipe-form__input--error': !!formError?.fields.servings }"
          required
        />
      </div>

      <label class="recipe-form__toggle">
        <input v-model="isVegan" type="checkbox" />
        <span class="recipe-form__toggle-label">Vegan</span>
      </label>
    </div>

    <section class="recipe-form__lines" aria-labelledby="ingredients-heading">
      <h3 id="ingredients-heading" class="recipe-form__section-title">Zutaten</h3>

      <p v-if="recipeStore.ingredients.length === 0" class="recipe-form__hint">
        Lege zuerst mindestens eine Zutat an, um ein Rezept zu erstellen.
      </p>

      <div
        v-for="(line, index) in lines"
        :key="index"
        class="recipe-form__line"
      >
        <select
          v-model="line.ingredientId"
          class="recipe-form__select recipe-form__select--ingredient"
          required
          @change="onIngredientChange(line)"
        >
          <option value="" disabled>Zutat wählen</option>
          <option
            v-for="ingredient in recipeStore.ingredients"
            :key="ingredient.id"
            :value="ingredient.id"
          >
            {{ ingredient.name }}
          </option>
        </select>

        <input
          v-model="line.quantity"
          type="number"
          min="0.1"
          step="any"
          class="recipe-form__input recipe-form__input--quantity"
          placeholder="Menge"
          required
        />

        <input
          v-model="line.unit"
          type="text"
          class="recipe-form__input recipe-form__input--unit"
          placeholder="Einheit"
          required
        />

        <button
          type="button"
          class="recipe-form__line-remove"
          :aria-label="`Zutat ${index + 1} entfernen`"
          @click="removeLine(index)"
        >
          ×
        </button>
      </div>

      <button
        type="button"
        class="recipe-form__add-line"
        :disabled="recipeStore.ingredients.length === 0"
        @click="addLine"
      >
        + Zutat hinzufügen
      </button>
    </section>

    <button
      type="submit"
      class="recipe-form__submit"
      :disabled="isSubmitting || !canSubmit"
    >
      {{ isSubmitting ? 'Speichern...' : 'Rezept speichern' }}
    </button>
  </form>
</template>

<script setup lang="ts">
import type { CreateRecipePayload, RecipeDetail } from '~/stores/recipes';

interface RecipeLineDraft {
  ingredientId: string;
  quantity: string;
  unit: string;
}

const recipeStore = useRecipeStore();

const emit = defineEmits<{
  created: [detail: RecipeDetail];
}>();

const name = ref('');
const category = ref('');
const servings = ref(1);
const isVegan = ref(false);
const lines = ref<RecipeLineDraft[]>([emptyLine()]);
const isSubmitting = ref(false);
const formError = ref<ReturnType<typeof parseApiError> | null>(null);

const canSubmit = computed(() => {
  if (isSubmitting.value) return false;
  if (!name.value.trim()) return false;
  if (lines.value.length === 0) return false;
  return lines.value.every(
    (line) =>
      line.ingredientId.length > 0 &&
      Number(line.quantity) > 0 &&
      line.unit.trim().length > 0,
  );
});

function emptyLine(): RecipeLineDraft {
  return { ingredientId: '', quantity: '', unit: '' };
}

function addLine() {
  lines.value.push(emptyLine());
}

function removeLine(index: number) {
  lines.value.splice(index, 1);
  if (lines.value.length === 0) {
    lines.value.push(emptyLine());
  }
}

function onIngredientChange(line: RecipeLineDraft) {
  const ingredient = recipeStore.ingredients.find((i) => i.id === line.ingredientId);
  if (ingredient && !line.unit.trim()) {
    line.unit = ingredient.defaultUnit;
  }
}

async function onSubmit() {
  if (isSubmitting.value || !canSubmit.value) return;

  formError.value = null;
  isSubmitting.value = true;

  const payload: CreateRecipePayload = {
    name: name.value.trim(),
    category: category.value.trim() || undefined,
    servings: servings.value,
    isVegan: isVegan.value,
    ingredients: lines.value.map((line) => ({
      ingredientId: line.ingredientId,
      quantity: Number(line.quantity),
      unit: line.unit.trim(),
    })),
  };

  try {
    const detail = await recipeStore.createRecipe(payload);
    reset();
    emit('created', detail);
  } catch (error) {
    formError.value = parseApiError(error);
  } finally {
    isSubmitting.value = false;
  }
}

function reset() {
  name.value = '';
  category.value = '';
  servings.value = 1;
  isVegan.value = false;
  lines.value = [emptyLine()];
  formError.value = null;
}
</script>

<style scoped>
.recipe-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.recipe-form__error {
  padding: var(--space-3) var(--space-4);
  font: var(--text-body-sm);
  color: var(--color-error);
  background-color: var(--color-surface-alt);
  border-left: var(--space-1) solid var(--color-error);
  border-radius: var(--radius-sm);
}

.recipe-form__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.recipe-form__field--inline {
  flex-direction: row;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
}

.recipe-form__inline-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  flex: 1 1 auto;
}

.recipe-form__label {
  font: var(--text-caption);
  color: var(--color-text-primary);
}

.recipe-form__input,
.recipe-form__select {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  font: var(--text-body);
  color: var(--color-text-primary);
  background-color: var(--color-surface-alt);
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--radius-md);
}

.recipe-form__input::placeholder,
.recipe-form__select:disabled {
  color: var(--color-text-secondary);
}

.recipe-form__input:focus,
.recipe-form__select:focus {
  outline: none;
  border-color: var(--color-primary);
}

.recipe-form__input--error,
.recipe-form__select--error {
  border-color: var(--color-error);
}

.recipe-form__input--quantity {
  min-width: 5rem;
}

.recipe-form__input--unit {
  min-width: 4rem;
}

.recipe-form__field-error {
  margin: 0;
  font: var(--text-caption);
  color: var(--color-error);
}

.recipe-form__toggle {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) 0;
  cursor: pointer;
}

.recipe-form__toggle input {
  width: var(--space-5);
  height: var(--space-5);
  accent-color: var(--color-accent);
}

.recipe-form__toggle-label {
  font: var(--text-body);
  color: var(--color-text-primary);
}

.recipe-form__lines {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  background-color: var(--color-surface);
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--radius-md);
}

.recipe-form__section-title {
  margin: 0;
  font: var(--text-h3);
  color: var(--color-text-primary);
}

.recipe-form__hint {
  margin: 0;
  font: var(--text-body-sm);
  color: var(--color-text-secondary);
}

.recipe-form__line {
  display: grid;
  grid-template-columns: 1fr auto auto auto;
  gap: var(--space-2);
  align-items: center;
}

.recipe-form__select--ingredient {
  min-width: 0;
}

.recipe-form__line-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--space-10);
  height: var(--space-10);
  font: var(--text-body);
  color: var(--color-error);
  background-color: var(--color-surface-alt);
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
}

.recipe-form__line-remove:hover {
  background-color: var(--color-surface);
}

.recipe-form__add-line,
.recipe-form__submit {
  padding: var(--space-3) var(--space-4);
  font: var(--text-body);
  font-weight: 600;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
}

.recipe-form__add-line {
  color: var(--color-primary);
  background-color: var(--color-surface-alt);
  border: var(--border-width) dashed var(--color-border);
}

.recipe-form__add-line:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.recipe-form__submit {
  color: var(--color-text-on-primary);
  background-color: var(--color-primary);
}

.recipe-form__submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.recipe-form__submit:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
}
</style>
