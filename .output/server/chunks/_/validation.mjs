import { k as readBody } from '../nitro/nitro.mjs';
import { z } from 'zod';
import { b as createValidationError } from './errors.mjs';

const email = z.string().trim().toLowerCase().email("Invalid email address").max(254, "Email too long");
const password = z.string().min(8, "Password must be at least 8 characters").max(128, "Password too long");
const strongPassword = password.regex(/[A-Za-z]/, "Password must contain at least one letter").regex(/[0-9]/, "Password must contain at least one number");
const registerSchema = z.object({
  email,
  password: strongPassword,
  name: z.string().trim().min(1, "Name must not be empty").max(80, "Name too long").optional()
});
const loginSchema = z.object({
  email,
  password
  // no quality check on login — accept legacy passwords
});
const refreshSchema = z.object({
  refreshToken: z.string().min(20, "Refresh token too short").max(2048, "Refresh token too long")
});
async function validateBody(event, schema) {
  let raw;
  try {
    raw = await readBody(event);
  } catch {
    throw createValidationError(
      new z.ZodError([
        { code: "custom", path: ["body"], message: "Request body must be valid JSON" }
      ]),
      "Invalid JSON body"
    );
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw createValidationError(result.error);
  }
  return result.data;
}

export { registerSchema as a, loginSchema as l, refreshSchema as r, validateBody as v };
//# sourceMappingURL=validation.mjs.map
