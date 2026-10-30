import { Queue } from '@/infra/queue/queue.provider';
import { logger as baseLogger } from '@/infra/logger';
import { Exchange } from '@/shared/enums/queue/queue.enum';
import { ConnectionRegistry } from './connection-registry';

const logger = baseLogger.child('WsEventsConsumer');

export type WsFrame = {
  type: string;
  data: Record<string, unknown>;
};

export type WsDelivery = {
  userIds: string[];
  frame: WsFrame;
};

export const toDelivery = (routingKey: string, payload: unknown): WsDelivery | null => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const { participantIds, ...data } = payload as Record<string, unknown>;

  if (!Array.isArray(participantIds) || !participantIds.every((id) => typeof id === 'string')) {
    return null;
  }

  return { userIds: participantIds, frame: { type: routingKey, data } };
};

export class WsEventsConsumer extends Queue {
  constructor(private registry: ConnectionRegistry) {
    super();
  }

  async startConsumer(): Promise<void> {
    const queue = await WsEventsConsumer.consumeExchange(
      Exchange.EVENTS,
      '#',
      '',
      async (payload, msg) => {
        const { routingKey } = msg.fields;
        const delivery = toDelivery(routingKey, payload);

        if (!delivery) {
          logger.warn('Event without participantIds, discarded', { routingKey });
          return;
        }

        const sent = this.registry.send(delivery.userIds, JSON.stringify(delivery.frame));

        logger.debug('Event delivered', { routingKey, sent });
      },
      { exclusive: true },
    );

    logger.info('WsEventsConsumer started', { queue });
  }
}
