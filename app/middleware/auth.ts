/**
 * Route guard for protected pages.
 *
 * Applied to every tab page via `definePageMeta({ middleware: 'auth' })`.
 * Redirects unauthenticated visitors to `/login`. If a stored access token
 * exists without a loaded user profile, the middleware fetches `/api/auth/me`
 * once before rendering the page.
 */
export default defineNuxtRouteMiddleware(async () => {
  // The SPA runs client-only; guard against any Nitro/middleware edge cases.
  if (import.meta.server) return;

  const auth = useAuthStore();

  if (auth.accessToken && !auth.user) {
    await auth.loadUser();
  }

  if (!auth.accessToken) {
    return navigateTo('/login');
  }
});
