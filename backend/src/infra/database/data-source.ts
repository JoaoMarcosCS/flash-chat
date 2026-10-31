import { env } from '@/shared/environment/env';
import { DataSource } from 'typeorm';
import { join } from 'path';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.DB_HOST,
  database: env.DB_NAME,
  username: env.DB_USER,
  password: env.DB_PASS,
  port: env.DB_PORT,
  synchronize: false,
  migrations: [join(__dirname, 'migrations/*.{js,ts}')],
  entities: [join(__dirname, '../../modules/**/*.entity.{js,ts}')],
  logging: false,
  migrationsRun: false,
  poolSize: 10,
  extra: {
    idleTimeoutMillis: 30000, // fecha conexão ociosa após 30s
    statement_timeout: 40000, // o Postgres aborta query que passa de 30s (evita query travada segurando conexão)
  },
  connectTimeoutMS: 10000, // se passar de 10s tentando se conectar, retorna erro
});

export const initializeDataSource = async () => {
  if (!AppDataSource.isInitialized) {
    return await AppDataSource.initialize();
  }

  return AppDataSource;
};

export const destroyDataSource = async () => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
};
