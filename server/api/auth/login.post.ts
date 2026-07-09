import { eq } from 'drizzle-orm';
import { db, schema } from '../../db/client';
import { verifyPassword, signAccessToken, signRefreshToken, hashRefreshToken } from '../../utils/auth';
import { loginSchema, validateBody } from '../../utils/validation';
import { createAuthError } from '../../utils/errors';

export default defineEventHandler(async (event) => {
  const body = await validateBody(event, loginSchema);

  // Lookup user by email (case-insensitive via lower() index).
  const [user] = await db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      name: schema.users.name,
      passwordHash: schema.users.passwordHash,
      createdAt: schema.users.createdAt,
    })
    .from(schema.users)
    .where(eq(schema.users.email, body.email))
    .limit(1);

  if (!user) {
    throw createAuthError('Invalid email or password');
  }

  const valid = await verifyPassword(body.password, user.passwordHash);
  if (!valid) {
    throw createAuthError('Invalid email or password');
  }

  // Issue tokens.
  const accessToken = await signAccessToken(user.id, user.email);

  const [refreshRow] = await db
    .insert(schema.refreshTokens)
    .values({
      userId: user.id,
      tokenHash: '',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })
    .returning({ id: schema.refreshTokens.id });

  const refreshToken = await signRefreshToken(user.id, refreshRow.id);
  const tokenHash = hashRefreshToken(refreshToken);

  await db
    .update(schema.refreshTokens)
    .set({ tokenHash })
    .where(eq(schema.refreshTokens.id, refreshRow.id));

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    },
    accessToken,
    refreshToken,
  };
});
