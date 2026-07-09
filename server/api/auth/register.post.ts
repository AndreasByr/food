import { eq } from 'drizzle-orm';
import { db, schema } from '../../db/client';
import { hashPassword, signAccessToken, signRefreshToken, hashRefreshToken } from '../../utils/auth';
import { registerSchema, validateBody } from '../../utils/validation';
import { createConflictError } from '../../utils/errors';

export default defineEventHandler(async (event) => {
  const body = await validateBody(event, registerSchema);

  // Check for duplicate email (case-insensitive via lower() index).
  const existing = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, body.email))
    .limit(1);

  if (existing.length > 0) {
    throw createConflictError('A user with this email already exists');
  }

  // Hash password and insert user.
  const passwordHash = await hashPassword(body.password);
  const [user] = await db
    .insert(schema.users)
    .values({
      email: body.email,
      passwordHash,
      name: body.name ?? null,
    })
    .returning({
      id: schema.users.id,
      email: schema.users.email,
      name: schema.users.name,
      createdAt: schema.users.createdAt,
    });

  // Issue tokens.
  const accessToken = await signAccessToken(user.id, user.email);

  // Insert refresh token row first so we have an id for the jti claim.
  const [refreshRow] = await db
    .insert(schema.refreshTokens)
    .values({
      userId: user.id,
      tokenHash: '', // placeholder — updated below after we have the raw token
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })
    .returning({ id: schema.refreshTokens.id });

  const refreshToken = await signRefreshToken(user.id, refreshRow.id);
  const tokenHash = hashRefreshToken(refreshToken);

  // Update the row with the actual hash.
  await db
    .update(schema.refreshTokens)
    .set({ tokenHash })
    .where(eq(schema.refreshTokens.id, refreshRow.id));

  setResponseStatus(event, 201);
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
