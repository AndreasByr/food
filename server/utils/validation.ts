import { z } from 'zod';
import { createValidationError } from './errors';

// ─────────────────────────────────────────────────────────────────────────────
// Zod validation schemas + a readValidatedBody helper.
//
// Schemas are pure Zod objects — they can be used on both server and client
// (the client can import them for form validation in S03).
// ─────────────────────────────────────────────────────────────────────────────

// ── Reusable primitives ─────────────────────────────────────────────────────

const email = z
  .string()
  .trim()
  .toLowerCase()
  .email('Invalid email address')
  .max(254, 'Email too long');

const password = z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password too long');

// At least one letter and one number — a minimal quality gate.
const strongPassword = password
  .regex(/[A-Za-z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// ── Auth schemas ─────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  email,
  password: strongPassword,
  name: z.string().trim().min(1, 'Name must not be empty').max(80, 'Name too long').optional(),
});

export const loginSchema = z.object({
  email,
  password, // no quality check on login — accept legacy passwords
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(20, 'Refresh token too short').max(2048, 'Refresh token too long'),
});

// ── Inferred types ──────────────────────────────────────────────────────────

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;

// ── Helper ──────────────────────────────────────────────────────────────────

/**
 * Read and validate the request body against a Zod schema.
 *
 * Usage in an event handler:
 *   const body = await readValidatedBody(event, registerSchema);
 *
 * On validation failure, throws a structured 400 error with field-level
 * messages that the UI can map directly to form fields.
 */
export async function validateBody<T extends z.ZodType>(
  event: { request: { json: () => Promise<unknown> } },
  schema: T,
): Promise<z.infer<T>> {
  let raw: unknown;
  try {
    // Use readBody from h3 (auto-imported by Nitro) — it handles JSON parsing,
    // content-type checking, and body size limits.
    raw = await readBody(event);
  } catch {
    throw createValidationError(
      new z.ZodError([
        { code: 'custom', path: ['body'], message: 'Request body must be valid JSON' },
      ]),
      'Invalid JSON body',
    );
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    throw createValidationError(result.error);
  }
  return result.data;
}
