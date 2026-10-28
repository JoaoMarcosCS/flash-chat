/// <reference types="vitest" />

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },

  test: {
    environment: 'node',
    globals: true,

    include: ['src/tests/integration/**/*.spec.ts'],

    globalSetup: ['./src/tests/integration/global-setup.ts'],
    setupFiles: [
      './src/tests/setup.ts',
      './src/tests/integration/database.setup.ts',
      './src/tests/integration/queue.setup.ts',
    ],

    fileParallelism: false,
    hookTimeout: 120000,
  },
});
