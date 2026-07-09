import { describe, it, expect, beforeAll } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashRefreshToken,
} from '../../server/utils/auth';

// Set JWT_SECRET for unit tests (auth utilities read from process.env as fallback).
beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret-at-least-32-bytes-long!!';
});

describe('hashPassword / verifyPassword', () => {
  it('hashes a password to a non-plaintext string', async () => {
    const hashed = await hashPassword('hunter2hunter2');
    expect(hashed).not.toBe('hunter2hunter2');
    expect(hashed).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash format
  });

  it('verifies the correct password', async () => {
    const hashed = await hashPassword('correct');
    const result = await verifyPassword('correct', hashed);
    expect(result).toBe(true);
  });

  it('rejects the wrong password', async () => {
    const hashed = await hashPassword('correct');
    const result = await verifyPassword('wrong', hashed);
    expect(result).toBe(false);
  });

  it('produces different hashes for the same password (salt)', async () => {
    const h1 = await hashPassword('same');
    const h2 = await hashPassword('same');
    expect(h1).not.toBe(h2);
  });
});

describe('signAccessToken / verifyAccessToken', () => {
  it('round-trips: sign then verify returns the same payload', async () => {
    const token = await signAccessToken('user-1', 'a@b.c');
    const payload = await verifyAccessToken(token);
    expect(payload.sub).toBe('user-1');
    expect(payload.email).toBe('a@b.c');
    expect(payload.iat).toBeDefined();
    expect(payload.exp).toBeDefined();
  });

  it('rejects a tampered token', async () => {
    const token = await signAccessToken('user-1', 'a@b.c');
    // Flip the last character.
    const tampered = token.slice(0, -1) + (token.at(-1) === 'A' ? 'B' : 'A');
    await expect(verifyAccessToken(tampered)).rejects.toThrow();
  });

  it('rejects a token signed with a different secret', async () => {
    const token = await signAccessToken('user-1', 'a@b.c');
    // Change the secret.
    process.env.JWT_SECRET = 'different-secret-at-least-32-bytes!!';
    await expect(verifyAccessToken(token)).rejects.toThrow();
    // Restore.
    process.env.JWT_SECRET = 'test-secret-at-least-32-bytes-long!!';
  });
});

describe('signRefreshToken / verifyRefreshToken', () => {
  it('round-trips: sign then verify returns the same payload', async () => {
    const token = await signRefreshToken('user-1', 'refresh-row-id');
    const payload = await verifyRefreshToken(token);
    expect(payload.sub).toBe('user-1');
    expect(payload.jti).toBe('refresh-row-id');
  });

  it('rejects a tampered refresh token', async () => {
    const token = await signRefreshToken('user-1', 'refresh-row-id');
    const tampered = token.slice(0, -1) + (token.at(-1) === 'A' ? 'B' : 'A');
    await expect(verifyRefreshToken(tampered)).rejects.toThrow();
  });
});

describe('hashRefreshToken', () => {
  it('produces a 64-char hex string', () => {
    const hash = hashRefreshToken('some-raw-token');
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is deterministic', () => {
    const h1 = hashRefreshToken('same-input');
    const h2 = hashRefreshToken('same-input');
    expect(h1).toBe(h2);
  });

  it('produces different hashes for different inputs', () => {
    const h1 = hashRefreshToken('input-a');
    const h2 = hashRefreshToken('input-b');
    expect(h1).not.toBe(h2);
  });
});
