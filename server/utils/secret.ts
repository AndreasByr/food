/**
 * Reads the JWT secret from Nitro runtime config.
 *
 * Called once per request (via getSecretKey) — the runtime config lookup is
 * cheap (it's a property access on a frozen object). We don't cache at module
 * scope because the secret may differ between dev/test/prod environments and
 * module-scope caching would survive HMR reloads with stale values.
 */
export function getJwtSecret(): string {
  // Try useRuntimeConfig first (Nitro context), fall back to process.env
  // (useful in tests and non-Nitro contexts).
  let secret: string | undefined;
  try {
    const config = useRuntimeConfig();
    secret = config.jwtSecret as string;
  } catch {
    // useRuntimeConfig is not available outside Nitro (e.g. vitest).
  }
  if (!secret || secret.length === 0) {
    secret = process.env.JWT_SECRET;
  }
  if (!secret || secret.length < 32) {
    throw new Error(
      'JWT_SECRET is not set or too short (< 32 bytes). ' +
        'Set it via env (see .env.example) or Coolify env vars.',
    );
  }
  return secret;
}

/**
 * Returns the secret as a Uint8Array suitable for jose's SignJWT / jwtVerify.
 */
export function getSecretKey(): Uint8Array {
  return new TextEncoder().encode(getJwtSecret());
}
