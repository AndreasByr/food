/**
 * Recipe store (Pinia)
 *
 * Manages the authenticated user's recipes and ingredients, and provides
 * the API surface used by the Plan tab forms and cards. All calls use the
 * authenticated `useApi` client from T03.
 */

export interface Ingredient {
  id: string;
  userId: string;
  name: string;
  defaultUnit: string;
  kcalPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbsPer100g: number;
  createdAt: string;
  updatedAt: string;
}

export interface RecipeIngredient {
  id: string;
  ingredientId: string;
  quantity: number;
  unit: string;
  position: number;
  ingredient: Ingredient;
}

export interface Macros {
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface RecipeSummary {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  category: string | null;
  imageRelativePath: string | null;
  servings: number;
  isVegan: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RecipeDetail extends RecipeSummary {
  ingredients: RecipeIngredient[];
  macros: Macros;
}

export interface CreateRecipeLineInput {
  ingredientId: string;
  quantity: number;
  unit: string;
}

export interface CreateRecipePayload {
  name: string;
  description?: string;
  prepSteps?: string;
  category?: string;
  servings?: number;
  isVegan?: boolean;
  ingredients: CreateRecipeLineInput[];
}

export interface CreateIngredientPayload {
  name: string;
  defaultUnit?: string;
  kcalPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbsPer100g: number;
}

export const useRecipeStore = defineStore('recipes', () => {
  const api = useApi();

  const recipes = ref<Array<RecipeSummary | RecipeDetail>>([]);
  const recipeDetails = ref<Record<string, RecipeDetail>>({});
  const ingredients = ref<Ingredient[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const sortedIngredients = computed(() =>
    [...ingredients.value].sort((a, b) => a.name.localeCompare(b.name)),
  );

  function setError(message: string | null) {
    error.value = message;
  }

  async function loadRecipes() {
    isLoading.value = true;
    setError(null);
    try {
      recipes.value = await api.get<RecipeSummary[]>('/api/recipes');
    } catch (err) {
      setError(parseApiError(err).message);
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function loadRecipe(id: string): Promise<RecipeDetail> {
    setError(null);
    const detail = await api.get<RecipeDetail>(`/api/recipes/${id}`);
    recipeDetails.value[id] = detail;
    return detail;
  }

  async function createRecipe(payload: CreateRecipePayload): Promise<RecipeDetail> {
    setError(null);
    const detail = await api.post<RecipeDetail>('/api/recipes', payload);
    recipes.value.unshift(detail);
    recipeDetails.value[detail.id] = detail;
    return detail;
  }

  async function deleteRecipe(id: string): Promise<void> {
    setError(null);
    await api.del(`/api/recipes/${id}`);
    recipes.value = recipes.value.filter((r) => r.id !== id);
    delete recipeDetails.value[id];
  }

  async function loadIngredients() {
    setError(null);
    ingredients.value = await api.get<Ingredient[]>('/api/ingredients');
  }

  async function createIngredient(payload: CreateIngredientPayload): Promise<Ingredient> {
    setError(null);
    const ingredient = await api.post<Ingredient>('/api/ingredients', payload);
    ingredients.value.push(ingredient);
    ingredients.value.sort((a, b) => a.name.localeCompare(b.name));
    return ingredient;
  }

  function clearError() {
    error.value = null;
  }

  return {
    recipes: readonly(recipes),
    recipeDetails: readonly(recipeDetails),
    ingredients: sortedIngredients,
    isLoading: readonly(isLoading),
    error: readonly(error),
    loadRecipes,
    loadRecipe,
    createRecipe,
    deleteRecipe,
    loadIngredients,
    createIngredient,
    setError,
    clearError,
  };
});
