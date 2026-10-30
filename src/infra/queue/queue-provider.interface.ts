export type ConsumeOptions = {
  prefetch: number;
  durable: boolean;
  noAck: boolean;
  retry?: {
    delayMs: number;
    maxAttempts: number;
  };
};

export type QueueMessage<T> = {
  data: T;
  routingKey: string;
  attempt: number;
};

export interface IQueueConsumer<T = unknown> {
  consume(message: QueueMessage<T>): Promise<void>;
}

export interface IQueueProvider {
  publish(queue: string, data: unknown): Promise<void>;
  publishExchange(exchange: string, routingKey: string, data: unknown): Promise<void>;
  consume<T>(queue: string, consumer: IQueueConsumer<T>, options: ConsumeOptions): Promise<string>;
  consumeExchange<T>(
    exchange: string,
    routingKey: string,
    queue: string,
    consumer: IQueueConsumer<T>,
    options: ConsumeOptions,
  ): Promise<string>;
  close(): Promise<void>;
}
