import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    // Arquivos ignorados pelo ESLint
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'eslint.config.mts',
      'jest.config.ts', // Arquivo de config do Jest (não está no tsconfig.json)
      'vitest.config.ts', // Arquivo de config do Vitest (não está no tsconfig.json)
    ],
  },

  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      globals: globals.node,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      'no-console': 'warn',
    },
  },

  {
    files: ['**/*.{ts,mts,cts}'],
    languageOptions: {
      globals: globals.node,
      parser: tseslint.parser,
      parserOptions: {
        project: true,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      prettier,
    },
    rules: {
      'prettier/prettier': 'error',
      '@typescript-eslint/no-unused-vars': ['warn'],
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
]);
