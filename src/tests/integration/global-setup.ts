import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { RabbitMQContainer, StartedRabbitMQContainer } from '@testcontainers/rabbitmq';
import type { TestProject } from 'vitest/node';

const RABBITMQ_AMQP_PORT = 5672;

let postgres: StartedPostgreSqlContainer;
let rabbitmq: StartedRabbitMQContainer;

export async function setup(project: TestProject) {
  [postgres, rabbitmq] = await Promise.all([
    new PostgreSqlContainer('postgres:16-alpine').start(),
    new RabbitMQContainer('rabbitmq:4.1-alpine').start(),
  ]);

  project.provide('pgConnectionUri', postgres.getConnectionUri());
  project.provide('rabbitmqHost', rabbitmq.getHost());
  project.provide('rabbitmqPort', rabbitmq.getMappedPort(RABBITMQ_AMQP_PORT));
}

export async function teardown() {
  await Promise.all([postgres.stop(), rabbitmq.stop()]);
}

declare module 'vitest' {
  interface ProvidedContext {
    pgConnectionUri: string;
    rabbitmqHost: string;
    rabbitmqPort: number;
  }
}
