import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['tests/setup.ts'],
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    // Integration tests need a real DB and are slower.
    testTimeout: 30_000,
    hookTimeout: 30_000,
    // Run test files sequentially — the shared test DB can't handle
    // parallel truncation from multiple files.
    fileParallelism: false,
  },
  resolve: {
    alias: {
      '~': resolve(__dirname),
      '@': resolve(__dirname),
    },
  },
});
