/**
 * Parse a `$fetch` error into a shape the UI can render.
 *
 * Server endpoints return structured bodies like:
 *   { statusCode: 400, message: "Validation failed", errors: { email: [...] } }
 *
 * This helper normalizes the top-level message and any field-level messages
 * so forms can display them without inspecting raw fetch internals.
 */

export interface ParsedApiError {
  message: string;
  fields: Record<string, string>;
  statusCode?: number;
}

export function parseApiError(error: unknown): ParsedApiError {
  const fetchError = error as {
    statusCode?: number;
    statusMessage?: string;
    data?: {
      statusCode?: number;
      message?: string;
      errors?: Record<string, string[]>;
    };
    message?: string;
  };

  const statusCode =
    fetchError.data?.statusCode ?? fetchError.statusCode ?? 0;

  let message = 'Ein unbekannter Fehler ist aufgetreten.';
  if (fetchError.data?.message) {
    message = fetchError.data.message;
  } else if (fetchError.statusMessage) {
    message = fetchError.statusMessage;
  } else if (fetchError.message) {
    message = fetchError.message;
  }

  const fields: Record<string, string> = {};
  const fieldErrors = fetchError.data?.errors;
  if (fieldErrors) {
    for (const [key, messages] of Object.entries(fieldErrors)) {
      if (Array.isArray(messages) && messages.length > 0 && typeof messages[0] === 'string') {
        fields[key] = messages[0];
      }
    }
  }

  return { message, fields, statusCode };
}
