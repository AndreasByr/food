/**
 * Authenticated API client.
 *
 * Wraps `$fetch` with:
 *   - automatic `Authorization: Bearer <accessToken>` header
 *   - refresh-on-401 using the auth store's refresh token
 *   - a single refresh in flight even when multiple requests fail concurrently
 *
 * All non-auth API calls in the app go through this composable.
 */

type FetchOptions = NonNullable<Parameters<typeof $fetch>[1]>;

export function useApi() {
  const auth = useAuthStore();

  async function request<T>(
    url: string,
    options?: FetchOptions & { _retry?: boolean },
  ): Promise<T> {
    const { _retry, ...fetchOptions } = options ?? {};
    const headers: Record<string, string> = {
      ...(fetchOptions.headers as Record<string, string> | undefined),
    };

    if (auth.accessToken) {
      headers.Authorization = `Bearer ${auth.accessToken}`;
    }

    try {
      return await $fetch<T>(url, { ...fetchOptions, headers });
    } catch (rawError) {
      const error = rawError as { statusCode?: number };
      if (error.statusCode === 401 && !_retry && auth.refreshToken) {
        const refreshed = await auth.refreshAccessToken();
        if (refreshed) {
          return request<T>(url, { ...options, _retry: true });
        }
      }
      throw rawError;
    }
  }

  return {
    request,
    get: <T>(url: string, options?: FetchOptions) =>
      request<T>(url, { ...options, method: 'GET' }),
    post: <T>(url: string, body: unknown, options?: FetchOptions) =>
      request<T>(url, { ...options, method: 'POST', body }),
    put: <T>(url: string, body: unknown, options?: FetchOptions) =>
      request<T>(url, { ...options, method: 'PUT', body }),
    patch: <T>(url: string, body: unknown, options?: FetchOptions) =>
      request<T>(url, { ...options, method: 'PATCH', body }),
    del: <T>(url: string, options?: FetchOptions) =>
      request<T>(url, { ...options, method: 'DELETE' }),
  };
}
