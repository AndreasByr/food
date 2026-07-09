import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { createHash } from 'node:crypto';
import { getSecretKey } from './secret';

const { compare, hash: bcryptHash } = bcrypt;

// ─────────────────────────────────────────────────────────────────────────────
// Auth utilities — password hashing, JWT sign/verify, refresh-token hashing.
//
// All functions are pure (no DB, no Nitro context) and unit-testable in
// isolation. The only runtime dependency is getSecretKey() which reads
// useRuntimeConfig().jwtSecret.
// ─────────────────────────────────────────────────────────────────────────────

// ── Constants ────────────────────────────────────────────────────────────────

const BCRYPT_ROUNDS = 12;
const ACCESS_TTL = '15 minutes';
const REFRESH_TTL = '7 days';

// ── Types ───────────────────────────────────────────────────────────────────

export interface JwtPayload {
  sub: string; // user id (uuid)
  email: string;
  iat?: number;
  exp?: number;
}

export interface RefreshJwtPayload {
  sub: string; // user id (uuid)
  jti: string; // refresh token row id (uuid) — links JWT to revocation record
  iat?: number;
  exp?: number;
}

// ── Password hashing ────────────────────────────────────────────────────────

/**
 * Hash a plaintext password with bcrypt (cost factor 12).
 * Returns the full bcrypt hash string (60 chars, includes salt).
 */
export async function hashPassword(plain: string): Promise<string> {
  return bcryptHash(plain, BCRYPT_ROUNDS);
}

/**
 * Compare a plaintext password against a bcrypt hash.
 */
export async function verifyPassword(
  plain: string,
  hashed: string,
): Promise<boolean> {
  return compare(plain, hashed);
}

// ── JWT signing ─────────────────────────────────────────────────────────────

/**
 * Sign an access token (HS256, 15 min).
 * Payload: { sub: userId, email, iat, exp }
 */
export async function signAccessToken(
  userId: string,
  email: string,
): Promise<string> {
  const secret = getSecretKey();
  return new SignJWT({ sub: userId, email } satisfies JwtPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TTL)
    .sign(secret);
}

/**
 * Sign a refresh token (HS256, 7 days).
 * Payload: { sub: userId, jti: refreshTokenRowId, iat, exp }
 */
export async function signRefreshToken(
  userId: string,
  refreshTokenRowId: string,
): Promise<string> {
  const secret = getSecretKey();
  return new SignJWT({
    sub: userId,
    jti: refreshTokenRowId,
  } satisfies RefreshJwtPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TTL)
    .sign(secret);
}

// ── JWT verification ────────────────────────────────────────────────────────

/**
 * Verify an access token and return its payload.
 * Throws jose.errors.JWTExpired if expired, JWTInvalid if tampered.
 */
export async function verifyAccessToken(token: string): Promise<JwtPayload> {
  const secret = getSecretKey();
  const { payload } = await jwtVerify<JwtPayload>(token, secret, {
    algorithms: ['HS256'],
  });
  return payload;
}

/**
 * Verify a refresh token and return its payload.
 * Throws jose.errors.JWTExpired if expired, JWTInvalid if tampered.
 */
export async function verifyRefreshToken(
  token: string,
): Promise<RefreshJwtPayload> {
  const secret = getSecretKey();
  const { payload } = await jwtVerify<RefreshJwtPayload>(token, secret, {
    algorithms: ['HS256'],
  });
  return payload;
}

// ── Refresh token hashing ───────────────────────────────────────────────────

/**
 * Hash a raw refresh JWT with SHA-256 for storage in refresh_tokens.token_hash.
 *
 * We never store the raw refresh token in the DB — only its SHA-256 hash.
 * A DB leak does not directly expose active refresh tokens (defense-in-depth:
 * the JWT itself is the credential, but the hash prevents offline cracking).
 */
export function hashRefreshToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}
