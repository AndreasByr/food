import { and, eq, isNull } from 'drizzle-orm';
import { db, schema } from '../../db/client';
import {
  verifyRefreshToken,
  signAccessToken,
  signRefreshToken,
  hashRefreshToken,
} from '../../utils/auth';
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

  // Lookup the refresh_tokens row by jti.
  const [row] = await db
    .select({
      id: schema.refreshTokens.id,
      userId: schema.refreshTokens.userId,
      tokenHash: schema.refreshTokens.tokenHash,
      revokedAt: schema.refreshTokens.revokedAt,
      expiresAt: schema.refreshTokens.expiresAt,
    })
    .from(schema.refreshTokens)
    .where(eq(schema.refreshTokens.id, payload.jti))
    .limit(1);

  if (!row) {
    throw createAuthError('Invalid or expired refresh token');
  }

  // Check not revoked.
  if (row.revokedAt) {
    // Token reuse detected — revoke all refresh tokens for this user
    // (defense-in-depth against token theft).
    await db
      .update(schema.refreshTokens)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(schema.refreshTokens.userId, row.userId),
          isNull(schema.refreshTokens.revokedAt),
        ),
      );
    throw createAuthError('Refresh token has been revoked');
  }

  // Check not expired.
  if (new Date(row.expiresAt) < new Date()) {
    throw createAuthError('Refresh token has expired');
  }

  // Verify the hash matches (defense-in-depth: the JWT itself is the credential,
  // but this catches a mismatch between the JWT and the stored hash).
  const expectedHash = hashRefreshToken(body.refreshToken);
  if (row.tokenHash !== expectedHash) {
    throw createAuthError('Invalid refresh token');
  }

  // Revoke the old refresh token (rotation).
  await db
    .update(schema.refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(schema.refreshTokens.id, row.id));

  // Lookup user for the new access token.
  const [user] = await db
    .select({ id: schema.users.id, email: schema.users.email })
    .from(schema.users)
    .where(eq(schema.users.id, row.userId))
    .limit(1);

  if (!user) {
    throw createAuthError('User not found');
  }

  // Issue new token pair.
  const accessToken = await signAccessToken(user.id, user.email);

  const [newRefreshRow] = await db
    .insert(schema.refreshTokens)
    .values({
      userId: user.id,
      tokenHash: '',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })
    .returning({ id: schema.refreshTokens.id });

  const refreshToken = await signRefreshToken(user.id, newRefreshRow.id);
  const tokenHash = hashRefreshToken(refreshToken);

  await db
    .update(schema.refreshTokens)
    .set({ tokenHash })
    .where(eq(schema.refreshTokens.id, newRefreshRow.id));

  return { accessToken, refreshToken };
});
