import { eq } from 'drizzle-orm';
import { db, schema } from '../../db/client';
import { requireAuth } from '../../utils/require-auth';

export default defineEventHandler(async (event) => {
  const authUser = requireAuth(event);

  const [user] = await db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      name: schema.users.name,
      createdAt: schema.users.createdAt,
    })
    .from(schema.users)
    .where(eq(schema.users.id, authUser.id))
    .limit(1);

  if (!user) {
    // User deleted after token was issued — rare but possible.
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      data: { statusCode: 401, message: 'User not found' },
    });
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  };
});
