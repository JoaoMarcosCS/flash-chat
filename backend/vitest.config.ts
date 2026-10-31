/// <reference types="vitest" />

// ============================================================
// Configuração do Vitest - Test Runner para o projeto
// ============================================================
// O Vitest é um test runner moderno e rápido, compatível com
// TypeScript nativamente e com API similar ao Jest.
// ============================================================

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    // Configura o alias "@/" para apontar para a pasta "src/",
    // mantendo consistência com o tsconfig.json do projeto.
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },

  test: {
    // Define o ambiente de execução dos testes como Node.js
    // (adequado para APIs Express, diferente de "jsdom" que é para front-end)
    environment: 'node',

    // Habilita variáveis globais do Vitest (describe, it, expect, vi, etc.)
    // para não precisar importá-las manualmente em cada arquivo de teste.
    globals: true,

    // Padrão de arquivos que o Vitest vai considerar como testes.
    // Aceita arquivos com sufixo .test.ts ou .spec.ts em qualquer pasta.
    include: ['src/**/*.{test,spec}.ts'],

    // Pastas ignoradas na busca por testes.
    // Os testes de integração ficam de fora daqui: eles têm config
    // própria (vitest.integration.config.ts) e dependem de Docker.
    exclude: ['node_modules', 'dist', 'src/tests/integration/**'],

    // Arquivo executado antes de cada suite de testes.
    // Usado para configurar mocks globais, variáveis de ambiente, etc.
    setupFiles: ['./src/tests/setup.ts'],

    // Configuração de cobertura de código (coverage)
    coverage: {
      // Usa o provider V8, que é rápido e integrado ao Node.js
      provider: 'v8',

      // Formatos de relatório gerados:
      // - "text": exibe no terminal
      // - "html": gera relatório visual em coverage/
      // - "lcov": formato padrão para ferramentas de CI/CD
      reporter: ['text', 'html', 'lcov'],

      // Pastas/arquivos incluídos no cálculo de cobertura
      include: ['src/**/*.ts'],

      // Pastas/arquivos excluídos do cálculo de cobertura
      exclude: [
        'src/tests/**',
        'src/@types/**',
        'src/infra/database/migrations/**',
        'src/infra/http/server.ts',
      ],
    },
  },
});
