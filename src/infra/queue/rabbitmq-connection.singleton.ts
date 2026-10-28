import { connect, ChannelModel } from 'amqplib';
import { env } from '@/shared/environment/env';
import { logger as baseLogger } from '@/infra/logger';

const logger = baseLogger.child('RabbitMQ');

export class RabbitMQConnection {
  private static instance: RabbitMQConnection | null;
  private connection: ChannelModel;

  private constructor() {}

  static async getInstance(): Promise<RabbitMQConnection> {
    if (!this.instance) {
      this.instance = new RabbitMQConnection();
      await this.instance.connect();
    }

    return this.instance;
  }

  private async connect() {
    try {
      this.connection = await connect({
        hostname: env.RABBITMQ_HOST,
        port: env.RABBITMQ_PORT,
        username: env.RABBITMQ_USER,
        password: env.RABBITMQ_PASS,
      });

      this.connection.on('close', () => {
        logger.warn('Connection closed, clearing instance for auto-reconnect');
        RabbitMQConnection.instance = null;
      });

      this.connection.on('error', (error) => {
        logger.error('Connection error', { error });
        RabbitMQConnection.instance = null;
      });

      logger.info('Connected successfully');
    } catch (error) {
      RabbitMQConnection.instance = null;
      logger.error('Failed to connect', { error });
      throw error;
    }
  }

  getConnection(): ChannelModel {
    return this.connection;
  }
}
