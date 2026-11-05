import 'reflect-metadata';
import '@/infra/container/index';
import { container } from 'tsyringe';
import { initializeDataSource } from '@/infra/database/data-source';
import { logger as rootLogger } from '@/infra/logger';
import { PersistMessageConsumer } from '@/modules/messages/consumer/persist-message.consumer';

const logger = rootLogger.child('PersistConsumerServer');

async function initializePersistConsumer() {
  await initializeDataSource();
  await container.resolve(PersistMessageConsumer).start();

  logger.info('Persistence consumer is running');
}

initializePersistConsumer().catch((error) => {
  logger.error('Failed to initialize persistence consumer', { err: error });
  process.exit(1);
});
