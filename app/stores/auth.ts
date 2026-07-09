/**
 * Auth store (Pinia)
 *
 * Manages the authenticated user, access/refresh tokens, and token persistence.
 * Login/register/logout call the S01 auth endpoints directly; every other
 * authenticated request goes through `useApi` (T03), which attaches the access
 * token and refreshes it on 401.
 */

const ACCESS_TOKEN_KEY = 'foodora-access-token';
const REFRESH_TOKEN_KEY = 'foodora-refresh-token';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name?: string;
}

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(null);
  const refreshToken = ref<string | null>(null);
  const user = ref<AuthUser | null>(null);
  const initialized = ref(false);

  const isAuthenticated = computed(() => !!accessToken.value && !!user.value);

  // Shared refresh promise so concurrent 401 responses trigger only one rotation.
  let refreshPromise: Promise<boolean> | null = null;

  function setSession(session: AuthSession) {
    accessToken.value = session.accessToken;
    refreshToken.value = session.refreshToken;
    user.value = session.user;
    persistTokens();
  }

  function clearSession() {
    accessToken.value = null;
    refreshToken.value = null;
    user.value = null;
    if (import.meta.client) {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  }

  function persistTokens() {
    if (!import.meta.client) return;
    if (accessToken.value) {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken.value);
    } else {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
    }
    if (refreshToken.value) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken.value);
    } else {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  }

  function loadTokens() {
    if (!import.meta.client) return;
    accessToken.value = localStorage.getItem(ACCESS_TOKEN_KEY);
    refreshToken.value = localStorage.getItem(REFRESH_TOKEN_KEY);
    initialized.value = true;
  }

  async function login(input: LoginInput): Promise<AuthSession> {
    const result = await $fetch<AuthSession>('/api/auth/login', {
      method: 'POST',
      body: input,
    });
    setSession(result);
    return result;
  }

  async function register(input: RegisterInput): Promise<AuthSession> {
    const result = await $fetch<AuthSession>('/api/auth/register', {
      method: 'POST',
      body: input,
    });
    setSession(result);
    return result;
  }

  async function logout(): Promise<void> {
    const token = refreshToken.value;
    clearSession();
    if (token) {
      try {
        await $fetch('/api/auth/logout', {
          method: 'POST',
          body: { refreshToken: token },
        });
      } catch {
        // Local session is already cleared; server-side revocation is best-effort.
      }
    }
  }

  /**
   * Try to exchange the stored refresh token for a new access token.
   * Called by `useApi` when an authenticated request returns 401.
   *
   * Only one rotation runs at a time; overlapping callers await the same
   * promise and retry with the new token.
   */
  async function refreshAccessToken(): Promise<boolean> {
    const token = refreshToken.value;
    if (!token) return false;
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
      try {
        const result = await $fetch<{ accessToken: string; refreshToken: string }>(
          '/api/auth/refresh',
          {
            method: 'POST',
            body: { refreshToken: token },
          },
        );
        accessToken.value = result.accessToken;
        refreshToken.value = result.refreshToken;
        persistTokens();
        return true;
      } catch {
        clearSession();
        return false;
      }
    })();

    try {
      return await refreshPromise;
    } finally {
      refreshPromise = null;
    }
  }

  /**
   * Fetch the current user profile with the stored access token.
   * Used on initial route guard to resolve a stored token into a user.
   */
  async function loadUser(): Promise<AuthUser | null> {
    const token = accessToken.value;
    if (!token) return null;
    try {
      const me = await $fetch<AuthUser>('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      user.value = me;
      return me;
    } catch {
      clearSession();
      return null;
    }
  }

  // Hydrate from localStorage as soon as the store is created on the client.
  loadTokens();

  return {
    accessToken: readonly(accessToken),
    refreshToken: readonly(refreshToken),
    user,
    initialized,
    isAuthenticated,
    setSession,
    clearSession,
    login,
    register,
    logout,
    refreshAccessToken,
    loadUser,
  };
});
