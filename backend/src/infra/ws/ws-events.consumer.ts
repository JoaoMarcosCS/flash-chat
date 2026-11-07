import { inject, injectable } from 'tsyringe';
import {
  IQueueConsumer,
  IQueueProvider,
  QueueMessage,
} from '@/infra/queue/queue-provider.interface';
import { ILogger } from '@/infra/logger/logger.interface';
import { Exchange, QueueName, RoutingKey } from '@/shared/enums/queue/queue.enum';
import { UserDeactivatedEvent } from '@/modules/users/event/user-deactivated.event';
import { ConnectionRegistry } from './connection-registry';

export const USER_DEACTIVATED_CLOSE_CODE = 4003;

export type WsEvent = {
  type: string;
  data: Record<string, unknown>;
};

export type WsDelivery = {
  userIds: string[];
  event: WsEvent;
};

export const toDelivery = (routingKey: string, payload: unknown): WsDelivery | null => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const { participantIds, ...data } = payload as Record<string, unknown>;

  if (!Array.isArray(participantIds) || !participantIds.every((id) => typeof id === 'string')) {
    return null;
  }

  return { userIds: participantIds, event: { type: routingKey, data } };
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

    const sent = this.registry.send(delivery.userIds, JSON.stringify(delivery.event));

    this.logger.debug('Event delivered', { routingKey, sent });

    if (routingKey === RoutingKey.USER_DEACTIVATED) {
      const { user } = data as UserDeactivatedEvent;

      this.registry.close(user.id, USER_DEACTIVATED_CLOSE_CODE, 'Usuário desativado');
    }
  }
}
