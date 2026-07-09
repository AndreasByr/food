import { eq } from 'drizzle-orm';
import { db, schema } from '../../db/client';
import { verifyRefreshToken } from '../../utils/auth';
import { refreshSchema, validateBody } from '../../utils/validation';
import { createAuthError } from '../../utils/errors';

export default defineEventHandler(async (event) => {
  const body = await validateBody(event, refreshSchema);

  // Verify the refresh JWT.
  let payload;
  try {
    payload = await verifyRefreshToken(body.refreshToken);
  } catch {
    throw createAuthError('Invalid or expired refresh token');
  }

  // Mark the refresh token as revoked.
  const result = await db
    .update(schema.refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(schema.refreshTokens.id, payload.jti));

  // If no row was updated, the token was already revoked or never existed.
  // We still return 204 — logout is idempotent.
  setResponseStatus(event, 204);
  return null;
});
