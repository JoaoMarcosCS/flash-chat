import { readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

function findEntityFiles(directory: string): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...findEntityFiles(fullPath));
    } else if (entry.name.endsWith('.entity.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}

export async function loadEntities(): Promise<CallableFunction[]> {
  const modulesDir = resolve(__dirname, '../../modules');
  const files = findEntityFiles(modulesDir);

  const modules = await Promise.all(files.map((file) => import(file)));

  return modules.flatMap((mod) =>
    Object.values(mod as Record<string, unknown>).filter(
      (exported): exported is CallableFunction => typeof exported === 'function',
    ),
  );
}
