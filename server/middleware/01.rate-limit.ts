/**
 * Global rate-limiting middleware for /api/* routes.
 *
 * Uses Nitro's built-in storage (in-memory by default) as a counter store.
 * Per-IP sliding-window: 10 requests per second, 100 requests per minute.
 *
 * In-memory is acceptable for M1 (single Coolify container). If we scale
 * horizontally later, swap the storage driver to Redis/Upstash.
 */
const WINDOW_SEC = 1;
const MAX_PER_SEC = 10;
const WINDOW_MIN = 60;
const MAX_PER_MIN = 100;

function getClientIp(event: { node: { req: { socket: { remoteAddress?: string } } }; headers: Headers }): string {
  // X-Forwarded-For takes precedence when behind a reverse proxy (Coolify).
  const forwarded = event.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return event.node.req.socket.remoteAddress ?? '127.0.0.1';
}

export default defineEventHandler(async (event) => {
  // Only rate-limit API routes.
  if (!event.path.startsWith('/api/')) return;

  const ip = getClientIp(event);
  const now = Date.now();

  // Per-second bucket.
  const secKey = `ratelimit:${ip}:sec:${Math.floor(now / 1000)}`;
  const secCount = (await useStorage().getItem<number>(secKey)) ?? 0;
  if (secCount >= MAX_PER_SEC) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too Many Requests',
      data: { statusCode: 429, message: 'Too many requests' },
    });
  }
  await useStorage().setItem(secKey, secCount + 1, { ttl: WINDOW_SEC });

  // Per-minute bucket.
  const minKey = `ratelimit:${ip}:min:${Math.floor(now / 60000)}`;
  const minCount = (await useStorage().getItem<number>(minKey)) ?? 0;
  if (minCount >= MAX_PER_MIN) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too Many Requests',
      data: { statusCode: 429, message: 'Too many requests' },
    });
  }
  await useStorage().setItem(minKey, minCount + 1, { ttl: WINDOW_MIN });
});
