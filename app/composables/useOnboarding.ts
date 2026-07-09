const STORAGE_KEY = 'foodora-onboarding';

/**
 * Client-only onboarding gate.
 *
 * - Reads whether the user has already acknowledged the eating-disorder warning.
 * - Persists the acknowledgment to `localStorage`.
 * - If storage is unavailable (e.g. private mode), the gate simply returns to the
 *   not-onboarded state every session; the user must acknowledge again, which is
 *   the safest ethical default.
 */
export function useOnboarding() {
  function readFlag(): boolean {
    if (!import.meta.client) return false;
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }

  const isOnboarded = ref(readFlag());
  const isReady = ref(import.meta.client);

  function complete() {
    if (!import.meta.client) return;
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // Storage unavailable; keep the gate dismissed only for this session.
    }
    isOnboarded.value = true;
  }

  function reset() {
    if (!import.meta.client) return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage failures.
    }
    isOnboarded.value = false;
  }

  onMounted(() => {
    isOnboarded.value = readFlag();
    isReady.value = true;
  });

  return {
    isOnboarded,
    isReady,
    complete,
    reset,
  };
}
