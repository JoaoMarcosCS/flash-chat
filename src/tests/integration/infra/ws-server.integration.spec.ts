import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AddressInfo } from 'net';
import { Server } from 'http';
import { sign } from 'jsonwebtoken';
import { v7 as uuidv7 } from 'uuid';
import { WebSocket } from 'ws';
import { generateTokens } from '@/modules/auth/token/token';
import { env } from '@/shared/environment/env';
import { RabbitMQQueueProvider } from '@/infra/queue/rabbitmq-queue.provider';
import { logger } from '@/infra/logger';
import { Exchange, RoutingKey } from '@/shared/enums/queue/queue.enum';
import { ConnectionRegistry } from '@/infra/ws/connection-registry';
import { WsEventsConsumer } from '@/infra/ws/ws-events.consumer';
import { createWsServer, TOKEN_EXPIRED_CLOSE_CODE } from '@/infra/ws';

type Client = { socket: WebSocket; frames: unknown[] };

const makeUser = (name: string) => ({ id: uuidv7(), name, nickname: name.toLowerCase() });

const tokenFor = (user: ReturnType<typeof makeUser>) => generateTokens(user).accessToken;

const waitFor = async (condition: () => boolean, timeoutMs = 5000) => {
  const deadline = Date.now() + timeoutMs;

  while (!condition()) {
    if (Date.now() > deadline) {
      throw new Error('Timed out waiting for condition');
    }

    await new Promise((resolve) => setTimeout(resolve, 20));
  }
};

describe('WebSocket server (integração)', () => {
  let server: Server;
  let registry: ConnectionRegistry;
  const queue = new RabbitMQQueueProvider(logger);
  let url: string;
  const clients: WebSocket[] = [];

  const connect = (query: string): Promise<Client> =>
    new Promise((resolve, reject) => {
      const socket = new WebSocket(`${url}${query}`);
      const client: Client = { socket, frames: [] };

      clients.push(socket);
      socket.on('message', (data) => client.frames.push(JSON.parse(data.toString())));
      socket.on('open', () => resolve(client));
      socket.on('unexpected-response', (_, response) =>
        reject(new Error(`status ${response.statusCode}`)),
      );
      socket.on('error', reject);
    });

  beforeAll(async () => {
    registry = new ConnectionRegistry();
    await new WsEventsConsumer(queue, registry, logger).start();
    server = createWsServer(registry);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    url = `ws://localhost:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    clients.forEach((socket) => socket.terminate());
    await new Promise((resolve) => server.close(resolve));
    await queue.close();
  });

  it.each([
    ['without token', ''],
    ['with an invalid token', '?token=invalid'],
    ['with a refresh token', `?token=${generateTokens(makeUser('Ana')).refreshToken}`],
  ])('should reject the handshake %s with 401', async (_, query) => {
    await expect(connect(query)).rejects.toThrow('status 401');
  });

  it('should deliver an event to every socket of the participants only', async () => {
    const [ana, bruno, carla] = [makeUser('Ana'), makeUser('Bruno'), makeUser('Carla')];
    const anaPhone = await connect(`?token=${tokenFor(ana)}`);
    const anaLaptop = await connect(`?token=${tokenFor(ana)}`);
    const brunoPhone = await connect(`?token=${tokenFor(bruno)}`);
    const carlaPhone = await connect(`?token=${tokenFor(carla)}`);

    await queue.publishExchange(Exchange.EVENTS, RoutingKey.CHAT_CREATED, {
      participantIds: [ana.id, bruno.id],
      chat: { id: 'chat-1' },
    });

    await waitFor(() => [anaPhone, anaLaptop, brunoPhone].every((c) => c.frames.length === 1));

    const frame = { type: 'chat.created', data: { chat: { id: 'chat-1' } } };
    expect(anaPhone.frames).toEqual([frame]);
    expect(anaLaptop.frames).toEqual([frame]);
    expect(brunoPhone.frames).toEqual([frame]);
    expect(carlaPhone.frames).toEqual([]);
  });

  it('should remove the socket from the registry when it closes', async () => {
    const dani = makeUser('Dani');
    const client = await connect(`?token=${tokenFor(dani)}`);

    expect(registry.count(dani.id)).toBe(1);

    client.socket.close();

    await waitFor(() => registry.count(dani.id) === 0);
  });

  it('should close the socket with 4001 when the token expires', async () => {
    const eva = makeUser('Eva');
    const token = sign({ name: eva.name, nickname: eva.nickname }, env.JWT_SECRET, {
      subject: eva.id,
      algorithm: 'HS256',
      expiresIn: 1,
    });
    const client = await connect(`?token=${token}`);
    let closeCode = 0;
    client.socket.on('close', (code) => {
      closeCode = code;
    });

    await waitFor(() => closeCode !== 0, 3000);

    expect(closeCode).toBe(TOKEN_EXPIRED_CLOSE_CODE);
    expect(registry.count(eva.id)).toBe(0);
  });
});
