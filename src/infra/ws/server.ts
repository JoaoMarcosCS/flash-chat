import 'reflect-metadata';
import '@/infra/container/index';
import { container } from 'tsyringe';
import { env } from '@/shared/environment/env';
import { logger as rootLogger } from '@/infra/logger';
import { ConnectionRegistry } from './connection-registry';
import { WsEventsConsumer } from './ws-events.consumer';
import { createWsServer } from '.';

const logger = rootLogger.child('WsServer');

async function initializeWsServer() {
  await container.resolve(WsEventsConsumer).start();

  createWsServer(container.resolve(ConnectionRegistry)).listen(env.WS_PORT, () => {
    logger.info(`WebSocket server is running on port ${env.WS_PORT}`);
  });
}

initializeWsServer().catch((error) => {
  logger.error('Failed to initialize WebSocket server', { err: error });
  process.exit(1);
});
