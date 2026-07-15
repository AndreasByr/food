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

function isRelativeUrl(url: string): boolean {
  return !/^https?:\/\//i.test(url) && !url.startsWith('//');
}

export function useApi() {
  const auth = useAuthStore();
  const { public: publicConfig } = useRuntimeConfig();
  const apiBaseUrl = publicConfig.apiBaseUrl as string;

  function resolveUrl(url: string): string {
    if (!apiBaseUrl || !isRelativeUrl(url)) return url;
    const base = apiBaseUrl.replace(/\/$/, '');
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${base}${path}`;
  }

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

    const resolvedUrl = resolveUrl(url);

    try {
      return (await $fetch(resolvedUrl, { ...fetchOptions, headers })) as T;
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
    apiBaseUrl,
    request,
    get: <T>(url: string, options?: FetchOptions) =>
      request<T>(url, { ...options, method: 'GET' }),
    post: <T>(url: string, body?: unknown, options?: FetchOptions) =>
      request<T>(url, { ...options, method: 'POST', body: body as BodyInit | Record<string, unknown> | undefined }),
    put: <T>(url: string, body?: unknown, options?: FetchOptions) =>
      request<T>(url, { ...options, method: 'PUT', body: body as BodyInit | Record<string, unknown> | undefined }),
    patch: <T>(url: string, body?: unknown, options?: FetchOptions) =>
      request<T>(url, { ...options, method: 'PATCH', body: body as BodyInit | Record<string, unknown> | undefined }),
    del: <T>(url: string, options?: FetchOptions) =>
      request<T>(url, { ...options, method: 'DELETE' }),
  };
}
