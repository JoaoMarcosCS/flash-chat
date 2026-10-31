import { readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

export async function loadMigrations(): Promise<CallableFunction[]> {
  const migrationsDir = resolve(__dirname, '../../infra/database/migrations');
  const files = readdirSync(migrationsDir)
    .filter((name) => name.endsWith('.ts'))
    .sort()
    .map((name) => join(migrationsDir, name));

  const modules = await Promise.all(files.map((file) => import(file)));

  return modules.flatMap((mod) =>
    Object.values(mod as Record<string, unknown>).filter(
      (exported): exported is CallableFunction => typeof exported === 'function',
    ),
  );
}
