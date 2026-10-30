import { inject, injectable } from 'tsyringe';
import {
  IQueueConsumer,
  IQueueProvider,
  QueueMessage,
} from '@/infra/queue/queue-provider.interface';
import { ILogger } from '@/infra/logger/logger.interface';
import { Exchange, QueueName } from '@/shared/enums/queue/queue.enum';
import { ConnectionRegistry } from './connection-registry';

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

@injectable()
export class WsEventsConsumer implements IQueueConsumer {
  private logger: ILogger;

  constructor(
    @inject('IQueueProvider') private queue: IQueueProvider,
    @inject(ConnectionRegistry) private registry: ConnectionRegistry,
    @inject('ILogger') logger: ILogger,
  ) {
    this.logger = logger.child('WsEventsConsumer');
  }

  async start(): Promise<void> {
    await this.queue.consumeExchange(Exchange.EVENTS, '#', QueueName.WS_EVENTS, this, {
      prefetch: 1,
      durable: true,
      noAck: false,
    });
  }

  async consume({ data, routingKey }: QueueMessage<unknown>): Promise<void> {
    const delivery = toDelivery(routingKey, data);

    if (!delivery) {
      this.logger.warn('Event without participantIds, discarded', { routingKey });
      return;
    }

    const sent = this.registry.send(delivery.userIds, JSON.stringify(delivery.frame));

    this.logger.debug('Event delivered', { routingKey, sent });
  }
}
