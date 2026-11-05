import 'reflect-metadata';
import { container } from 'tsyringe';
import { env } from '@/shared/environment/env';
import { app } from './index';
import { initializeDataSource } from '@/infra/database/data-source';
import { logger as rootLogger } from '@/infra/logger';
import { ICacheProvider } from '@/infra/cache/cache-provider.interface';

const logger = rootLogger.child('Server');

async function initializeServer() {
  await initializeDataSource();
  container.resolve<ICacheProvider>('ICacheProvider');

  app.listen(env.API_PORT, () => {
    logger.info(`Server is running on port ${env.API_PORT}`);
  });
}

initializeServer().catch((error) => {
  logger.error('Failed to initialize server', { err: error });
  process.exit(1);
});
