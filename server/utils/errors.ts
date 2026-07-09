import type { ZodError } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
// Structured error helpers.
//
// Every error thrown by these helpers produces a consistent JSON body shape:
//   { statusCode, message, errors? }
//
// The UI (S03) can map statusCode to a toast and errors to form-field messages.
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiErrorBody {
  statusCode: number;
  message: string;
  errors?: Record<string, string[]>;
}

/**
 * Creates a Nitro H3 error with a structured JSON body for validation failures.
 *
 * @param zodError - The caught ZodError from schema.parse().
 * @param message   - Human-readable summary (default: "Validation failed").
 */
export function createValidationError(
  zodError: ZodError,
  message = 'Validation failed',
) {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of zodError.issues) {
    const path = issue.path.join('.') || '_root';
    if (!fieldErrors[path]) fieldErrors[path] = [];
    fieldErrors[path].push(issue.message);
  }

  return createError({
    statusCode: 400,
    statusMessage: 'Bad Request',
    data: {
      statusCode: 400,
      message,
      errors: fieldErrors,
    } satisfies ApiErrorBody,
  });
}

/**
 * Creates a 401 Unauthorized error with a structured JSON body.
 */
export function createAuthError(message = 'Missing or invalid token') {
  return createError({
    statusCode: 401,
    statusMessage: 'Unauthorized',
    data: {
      statusCode: 401,
      message,
    } satisfies ApiErrorBody,
  });
}

/**
 * Creates a 409 Conflict error (e.g. duplicate email on register).
 */
export function createConflictError(message = 'Resource already exists') {
  return createError({
    statusCode: 409,
    statusMessage: 'Conflict',
    data: {
      statusCode: 409,
      message,
    } satisfies ApiErrorBody,
  });
}

/**
 * Creates a 429 Too Many Requests error.
 */
export function createRateLimitError(message = 'Too many requests') {
  return createError({
    statusCode: 429,
    statusMessage: 'Too Many Requests',
    data: {
      statusCode: 429,
      message,
    } satisfies ApiErrorBody,
  });
}
