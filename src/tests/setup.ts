// ============================================================
// Setup Global dos Testes
// ============================================================
// Este arquivo é executado automaticamente ANTES de cada suite
// de testes (configurado em vitest.config.ts -> setupFiles).
// Use-o para:
//   - Definir variáveis de ambiente de teste
//   - Configurar mocks globais
//   - Inicializar/limpar recursos c
// ompartilhados
// ============================================================

// Polyfill necessário para o tsyringe funcionar.
// O tsyringe usa decorators do TypeScript que dependem da API de
// Reflect Metadata para injeção de dependência.
import 'reflect-metadata';

// Define variáveis de ambiente necessárias para os testes rodarem
// sem depender de um arquivo .env real.
// Isso garante que os testes sejam isolados e reproduzíveis.
process.env.API_PORT = '3333';
process.env.NODE_VERSION = '20';
process.env.ENVIRONMENT = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_USER = 'test_user';
process.env.DB_PASS = 'test_pass';
process.env.DB_NAME = 'test_db';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.JWT_SECRET = 'test-access-secret-0123456789abcdef';
process.env.JWT_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-0123456789abcdef';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
