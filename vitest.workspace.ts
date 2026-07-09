import { defineWorkspace } from 'vitest/config';

/**
 * Vitest workspace separating server-side tests (node, real test DB) from
 * client-side component tests (jsdom, mocked APIs).
 */
export default defineWorkspace([
  // Server-side unit + integration tests (node environment, real test DB).
  'vitest.config.ts',
  // Client-side UI component tests (jsdom, mocked APIs).
  'tests/components/vitest.config.ts',
]);
