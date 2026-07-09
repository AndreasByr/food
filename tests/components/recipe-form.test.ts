import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';

import RecipeForm from '~/components/RecipeForm.vue';
import { useRecipeStore } from '~/stores/recipes';
import { mountWithPinia } from './test-utils';

const tomato: { id: string; name: string; defaultUnit: string; kcalPer100g: number; proteinPer100g: number; fatPer100g: number; carbsPer100g: number; userId: string; createdAt: string; updatedAt: string } = {
  id: 'ing-1',
  userId: 'u1',
  name: 'Tomaten',
  defaultUnit: 'Stück',
  kcalPer100g: 18,
  proteinPer100g: 0.9,
  fatPer100g: 0.2,
  carbsPer100g: 3.9,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const lentil: { id: string; name: string; defaultUnit: string; kcalPer100g: number; proteinPer100g: number; fatPer100g: number; carbsPer100g: number; userId: string; createdAt: string; updatedAt: string } = {
  id: 'ing-2',
  userId: 'u1',
  name: 'Rote Linsen',
  defaultUnit: 'g',
  kcalPer100g: 116,
  proteinPer100g: 9,
  fatPer100g: 0.4,
  carbsPer100g: 20,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function mockApiResponses() {
  ($fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string, options?: Record<string, unknown>) => {
    if (url === '/api/ingredients') {
      return Promise.resolve([tomato, lentil]);
    }
    if (url === '/api/recipes' && options?.method === 'POST') {
      return Promise.resolve({
        id: 'recipe-1',
        userId: 'u1',
        name: (options.body as Record<string, unknown>).name as string,
        description: null,
        category: (options.body as Record<string, unknown>).category as string | null,
        imageRelativePath: null,
        servings: (options.body as Record<string, unknown>).servings as number,
        isVegan: (options.body as Record<string, unknown>).isVegan as boolean,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ingredients: [],
        macros: { kcal: 0, protein: 0, fat: 0, carbs: 0 },
      });
    }
    return Promise.reject(new Error(`Unexpected fetch: ${url}`));
  });
}

describe('RecipeForm', () => {
  it('renders the recipe form and disables add-line when no ingredients are loaded', async () => {
    const wrapper = mountWithPinia(RecipeForm);
    await flushPromises();

    expect(document.body.querySelector('#recipe-name')).not.toBeNull();
    expect(document.body.querySelector('#recipe-servings')).not.toBeNull();
    expect(document.body.querySelector('.recipe-form__add-line')?.hasAttribute('disabled')).toBe(true);
    expect(document.body.querySelector('.recipe-form__submit')?.hasAttribute('disabled')).toBe(true);

    wrapper.unmount();
  });

  it('loads ingredients and enables adding lines once ingredients are available', async () => {
    mockApiResponses();
    const wrapper = mountWithPinia(RecipeForm);
    await flushPromises();

    const recipeStore = useRecipeStore();
    await recipeStore.loadIngredients();
    await flushPromises();

    expect(document.body.querySelector('.recipe-form__add-line')?.hasAttribute('disabled')).toBe(false);

    const options = Array.from(document.body.querySelectorAll('option')).map((el) => el.textContent);
    expect(options).toContain('Tomaten');
    expect(options).toContain('Rote Linsen');

    wrapper.unmount();
  });

  it('keeps the submit button disabled until the recipe has a name and valid ingredient lines', async () => {
    mockApiResponses();
    const wrapper = mountWithPinia(RecipeForm);
    await flushPromises();

    const recipeStore = useRecipeStore();
    await recipeStore.loadIngredients();
    await flushPromises();

    const submit = document.body.querySelector('.recipe-form__submit') as HTMLButtonElement | null;
    expect(submit?.disabled).toBe(true);

    const name = document.body.querySelector('#recipe-name') as HTMLInputElement | null;
    name!.value = 'Linsen-Dal';
    await name!.dispatchEvent(new Event('input'));
    await flushPromises();
    expect(submit?.disabled).toBe(true);

    const select = document.body.querySelector('.recipe-form__select--ingredient') as HTMLSelectElement | null;
    const quantity = document.body.querySelector('.recipe-form__input--quantity') as HTMLInputElement | null;
    const unit = document.body.querySelector('.recipe-form__input--unit') as HTMLInputElement | null;

    select!.value = tomato.id;
    await select!.dispatchEvent(new Event('change'));
    quantity!.value = '2';
    await quantity!.dispatchEvent(new Event('input'));
    unit!.value = 'Stück';
    await unit!.dispatchEvent(new Event('input'));
    await flushPromises();

    expect(submit?.disabled).toBe(false);

    wrapper.unmount();
  });

  it('calls createRecipe with the correct payload and emits created on success', async () => {
    mockApiResponses();
    const wrapper = mountWithPinia(RecipeForm);
    await flushPromises();

    const recipeStore = useRecipeStore();
    await recipeStore.loadIngredients();
    await flushPromises();

    const createRecipeSpy = vi.spyOn(recipeStore, 'createRecipe');

    const name = document.body.querySelector('#recipe-name') as HTMLInputElement | null;
    name!.value = 'Linsen-Dal';
    await name!.dispatchEvent(new Event('input'));

    const category = document.body.querySelector('#recipe-category') as HTMLInputElement | null;
    category!.value = 'Hauptgericht';
    await category!.dispatchEvent(new Event('input'));

    const select = document.body.querySelector('.recipe-form__select--ingredient') as HTMLSelectElement | null;
    const quantity = document.body.querySelector('.recipe-form__input--quantity') as HTMLInputElement | null;
    const unit = document.body.querySelector('.recipe-form__input--unit') as HTMLInputElement | null;

    select!.value = lentil.id;
    await select!.dispatchEvent(new Event('change'));
    quantity!.value = '200';
    await quantity!.dispatchEvent(new Event('input'));
    unit!.value = 'g';
    await unit!.dispatchEvent(new Event('input'));
    await flushPromises();

    const form = document.body.querySelector('.recipe-form') as HTMLFormElement | null;
    await form!.dispatchEvent(new Event('submit'));
    await flushPromises();

    expect(createRecipeSpy).toHaveBeenCalledWith({
      name: 'Linsen-Dal',
      category: 'Hauptgericht',
      servings: 1,
      isVegan: false,
      ingredients: [{ ingredientId: lentil.id, quantity: 200, unit: 'g' }],
    });
    expect(wrapper.emitted('created')).toHaveLength(1);

    wrapper.unmount();
  });
});
