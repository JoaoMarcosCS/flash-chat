import { afterAll, beforeAll, beforeEach, inject } from 'vitest';
import {
  AppDataSource,
  destroyDataSource,
  initializeDataSource,
} from '@/infra/database/data-source';
import { loadEntities } from '@/tests/integration/load-entities';
import { loadMigrations } from '@/tests/integration/load-migrations';

beforeAll(async () => {
  AppDataSource.setOptions({
    url: inject('pgConnectionUri'),
    entities: await loadEntities(),
    migrations: await loadMigrations(),
  });

  await initializeDataSource();
  await AppDataSource.runMigrations();
});

afterAll(async () => {
  await destroyDataSource();
});

beforeEach(async () => {
  const tables = AppDataSource.entityMetadatas
    .map((metadata) => `"${metadata.tableName}"`)
    .join(', ');

  if (tables) {
    await AppDataSource.query(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE`);
  }
});
