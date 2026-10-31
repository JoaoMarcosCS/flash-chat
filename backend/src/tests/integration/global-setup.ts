import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { RabbitMQContainer, StartedRabbitMQContainer } from '@testcontainers/rabbitmq';
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';
import type { TestProject } from 'vitest/node';

const RABBITMQ_AMQP_PORT = 5672;

let postgres: StartedPostgreSqlContainer;
let rabbitmq: StartedRabbitMQContainer;
let redis: StartedRedisContainer;

export async function setup(project: TestProject) {
  [postgres, rabbitmq, redis] = await Promise.all([
    new PostgreSqlContainer('postgres:16-alpine').start(),
    new RabbitMQContainer('rabbitmq:4.1-alpine').start(),
    new RedisContainer('redis:7-alpine').start(),
  ]);

  project.provide('pgConnectionUri', postgres.getConnectionUri());
  project.provide('rabbitmqHost', rabbitmq.getHost());
  project.provide('rabbitmqPort', rabbitmq.getMappedPort(RABBITMQ_AMQP_PORT));
  project.provide('redisHost', redis.getHost());
  project.provide('redisPort', redis.getPort());
}

export async function teardown() {
  await Promise.all([postgres.stop(), rabbitmq.stop(), redis.stop()]);
}

declare module 'vitest' {
  interface ProvidedContext {
    pgConnectionUri: string;
    rabbitmqHost: string;
    rabbitmqPort: number;
    redisHost: string;
    redisPort: number;
  }
}
