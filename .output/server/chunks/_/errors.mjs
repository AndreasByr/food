import { e as createError } from '../nitro/nitro.mjs';

function createValidationError(zodError, message = "Validation failed") {
  const fieldErrors = {};
  for (const issue of zodError.issues) {
    const path = issue.path.join(".") || "_root";
    if (!fieldErrors[path]) fieldErrors[path] = [];
    fieldErrors[path].push(issue.message);
  }
  return createError({
    statusCode: 400,
    statusMessage: "Bad Request",
    data: {
      statusCode: 400,
      message,
      errors: fieldErrors
    }
  });
}
function createAuthError(message = "Missing or invalid token") {
  return createError({
    statusCode: 401,
    statusMessage: "Unauthorized",
    data: {
      statusCode: 401,
      message
    }
  });
}
function createConflictError(message = "Resource already exists") {
  return createError({
    statusCode: 409,
    statusMessage: "Conflict",
    data: {
      statusCode: 409,
      message
    }
  });
}
function createNotFoundError(message = "Resource not found") {
  return createError({
    statusCode: 404,
    statusMessage: "Not Found",
    data: {
      statusCode: 404,
      message
    }
  });
}

export { createConflictError as a, createValidationError as b, createAuthError as c, createNotFoundError as d };
//# sourceMappingURL=errors.mjs.map
