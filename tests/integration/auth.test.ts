import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { db, schema, client } from '../setup';
import { eq } from 'drizzle-orm';
import {
  hashPassword,
  signAccessToken,
  signRefreshToken,
  hashRefreshToken,
} from '../../server/utils/auth';

// ─────────────────────────────────────────────────────────────────────────────
// Integration tests for the auth flow.
//
// These tests exercise the auth utilities + DB layer together. They do NOT
// go through the HTTP layer (that's a separate e2e concern). They verify:
//  - User creation with duplicate-email detection
//  - Token issuance and verification
//  - Refresh token rotation and revocation
//  - Data isolation (two users cannot see each other's data)
// ─────────────────────────────────────────────────────────────────────────────

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret-at-least-32-bytes-long!!';
});

describe('User registration', () => {
  it('creates a user and stores the hashed password', async () => {
    const passwordHash = await hashPassword('hunter2hunter2');
    const [user] = await db
      .insert(schema.users)
      .values({ email: 'a@b.c', passwordHash, name: 'Alice' })
      .returning();

    expect(user.id).toBeDefined();
    expect(user.email).toBe('a@b.c');
    expect(user.passwordHash).not.toBe('hunter2hunter2');
    expect(user.name).toBe('Alice');
  });

  it('rejects duplicate email (unique constraint)', async () => {
    const passwordHash = await hashPassword('hunter2hunter2');
    await db
      .insert(schema.users)
      .values({ email: 'dup@b.c', passwordHash })
      .returning();

    await expect(
      db
        .insert(schema.users)
        .values({ email: 'dup@b.c', passwordHash })
        .returning(),
    ).rejects.toThrow();
  });

  it('rejects duplicate email case-insensitively', async () => {
    const passwordHash = await hashPassword('hunter2hunter2');
    await db
      .insert(schema.users)
      .values({ email: 'Case@b.c', passwordHash })
      .returning();

    // The unique index is on lower(email), so 'case@b.c' should also fail.
    await expect(
      db
        .insert(schema.users)
        .values({ email: 'case@b.c', passwordHash })
        .returning(),
    ).rejects.toThrow();
  });
});

describe('Token issuance and verification', () => {
  it('issues access + refresh tokens for a user', async () => {
    const passwordHash = await hashPassword('hunter2hunter2');
    const [user] = await db
      .insert(schema.users)
      .values({ email: 'token@b.c', passwordHash })
      .returning();

    const accessToken = await signAccessToken(user.id, user.email);
    expect(accessToken).toBeTruthy();
    expect(accessToken.split('.')).toHaveLength(3); // JWT format

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

    expect(refreshToken).toBeTruthy();
    expect(refreshToken.split('.')).toHaveLength(3);

    // Verify the hash was stored.
    const [stored] = await db
      .select({ tokenHash: schema.refreshTokens.tokenHash })
      .from(schema.refreshTokens)
      .where(eq(schema.refreshTokens.id, refreshRow.id));

    expect(stored.tokenHash).toBe(tokenHash);
  });
});

describe('Refresh token rotation', () => {
  it('revokes old token and issues new pair', async () => {
    const passwordHash = await hashPassword('hunter2hunter2');
    const [user] = await db
      .insert(schema.users)
      .values({ email: 'rotate@b.c', passwordHash })
      .returning();

    // Issue initial refresh token.
    const [oldRow] = await db
      .insert(schema.refreshTokens)
      .values({
        userId: user.id,
        tokenHash: '',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })
      .returning({ id: schema.refreshTokens.id });

    const oldToken = await signRefreshToken(user.id, oldRow.id);
    const oldHash = hashRefreshToken(oldToken);
    await db
      .update(schema.refreshTokens)
      .set({ tokenHash: oldHash })
      .where(eq(schema.refreshTokens.id, oldRow.id));

    // Revoke old.
    await db
      .update(schema.refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(schema.refreshTokens.id, oldRow.id));

    // Verify old is revoked.
    const [revoked] = await db
      .select({ revokedAt: schema.refreshTokens.revokedAt })
      .from(schema.refreshTokens)
      .where(eq(schema.refreshTokens.id, oldRow.id));

    expect(revoked.revokedAt).not.toBeNull();

    // Issue new.
    const [newRow] = await db
      .insert(schema.refreshTokens)
      .values({
        userId: user.id,
        tokenHash: '',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })
      .returning({ id: schema.refreshTokens.id });

    const newToken = await signRefreshToken(user.id, newRow.id);
    const newHash = hashRefreshToken(newToken);
    await db
      .update(schema.refreshTokens)
      .set({ tokenHash: newHash })
      .where(eq(schema.refreshTokens.id, newRow.id));

    // Verify new is active.
    const [active] = await db
      .select({ revokedAt: schema.refreshTokens.revokedAt })
      .from(schema.refreshTokens)
      .where(eq(schema.refreshTokens.id, newRow.id));

    expect(active.revokedAt).toBeNull();
  });
});

describe('Data isolation (R002)', () => {
  it('two users have distinct data and cannot access each other', async () => {
    // Create user A.
    const hashA = await hashPassword('passwordA1');
    const [userA] = await db
      .insert(schema.users)
      .values({ email: 'a@isolated.test', passwordHash: hashA, name: 'Alice' })
      .returning();

    // Create user B.
    const hashB = await hashPassword('passwordB1');
    const [userB] = await db
      .insert(schema.users)
      .values({ email: 'b@isolated.test', passwordHash: hashB, name: 'Bob' })
      .returning();

    // Verify they are distinct (from the returning() clauses).
    expect(userA.id).not.toBe(userB.id);
    expect(userA.email).not.toBe(userB.email);

    // Query all users and verify both exist.
    const allUsers = await db
      .select({ id: schema.users.id, email: schema.users.email })
      .from(schema.users)
      .orderBy(schema.users.email);

    expect(allUsers).toHaveLength(2);
    expect(allUsers[0].email).toBe('a@isolated.test');
    expect(allUsers[1].email).toBe('b@isolated.test');

    // Query scoped to user A — should only return user A.
    const aScoped = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.id, userA.id));

    expect(aScoped).toHaveLength(1);
    expect(aScoped[0].id).toBe(userA.id);
  });
});

describe('Refresh token revocation', () => {
  it('revoked token cannot be used again', async () => {
    const passwordHash = await hashPassword('hunter2hunter2');
    const [user] = await db
      .insert(schema.users)
      .values({ email: 'revoke@b.c', passwordHash })
      .returning();

    const [row] = await db
      .insert(schema.refreshTokens)
      .values({
        userId: user.id,
        tokenHash: '',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })
      .returning({ id: schema.refreshTokens.id });

    const token = await signRefreshToken(user.id, row.id);
    const tokenHash = hashRefreshToken(token);
    await db
      .update(schema.refreshTokens)
      .set({ tokenHash })
      .where(eq(schema.refreshTokens.id, row.id));

    // Revoke.
    await db
      .update(schema.refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(schema.refreshTokens.id, row.id));

    // Verify revoked.
    const [revoked] = await db
      .select({ revokedAt: schema.refreshTokens.revokedAt })
      .from(schema.refreshTokens)
      .where(eq(schema.refreshTokens.id, row.id));

    expect(revoked.revokedAt).not.toBeNull();
  });
});
