import { beforeEach, describe, expect, it } from 'vitest';
import supertest from 'supertest';
import { app } from '@/infra/http/index';
import { ChatRepository } from '@/modules/chats/repository/chat.repository';
import { bearer, createUser, deactivate, sendMessage, TestUser } from './chat-fixtures';

const list = (user: TestUser, query: Record<string, string | number> = {}) =>
  supertest(app).get('/api/v1/chats').query(query).set('Authorization', bearer(user));

const ids = (body: { data: { id: string }[] }) => body.data.map((chat) => chat.id);

describe('GET /api/v1/chats (integração)', () => {
  let ana: TestUser;
  let bruno: TestUser;
  let carla: TestUser;
  let withBruno: string;
  let group: string;
  let withCarla: string;
  let messageId: string;

  beforeEach(async () => {
    const repository = new ChatRepository();
    ana = await createUser('Ana Souza', 'ana');
    bruno = await createUser('Bruno Lima', 'bruno');
    carla = await createUser('Carla Dias', 'carla');
    withBruno = (
      await repository.createDirectChat({ initiatorId: ana.id, participantId: bruno.id })
    ).id;
    group = (
      await repository.createGroup({
        initiatorId: bruno.id,
        title: 'Viagem',
        participantIds: [ana.id, carla.id],
      })
    ).id;
    withCarla = (
      await repository.createDirectChat({ initiatorId: carla.id, participantId: ana.id })
    ).id;
    messageId = await sendMessage(withBruno, bruno, 'Bora amanhã');
  });

  it('should return 401 without token', async () => {
    const response = await supertest(app).get('/api/v1/chats');

    expect(response.status).toBe(401);
  });

  it('should list chats by last message, then by creation', async () => {
    const response = await list(ana);

    expect(response.status).toBe(200);
    expect(response.body.nextCursor).toBeNull();
    expect(response.body.data).toEqual([
      {
        id: withBruno,
        isGroup: false,
        displayName: 'Bruno Lima',
        readOnly: false,
        lastMessage: {
          id: messageId,
          content: 'Bora amanhã',
          sender: { id: bruno.id, name: 'Bruno Lima' },
        },
      },
      {
        id: withCarla,
        isGroup: false,
        displayName: 'Carla Dias',
        readOnly: false,
        lastMessage: null,
      },
      { id: group, isGroup: true, displayName: 'Viagem', readOnly: false, lastMessage: null },
    ]);
  });

  it('should show the other participant name to each side of a direct chat', async () => {
    const response = await list(bruno);

    expect(response.body.data[0]).toMatchObject({ id: withBruno, displayName: 'Ana Souza' });
  });

  it('should keep read-only direct chats in the list', async () => {
    await deactivate(carla);

    const response = await list(ana);

    expect(response.body.data.find((chat: { id: string }) => chat.id === withCarla).readOnly).toBe(
      true,
    );
    expect(response.body.data.find((chat: { id: string }) => chat.id === group).readOnly).toBe(
      false,
    );
  });

  it('should paginate with nextCursor', async () => {
    const first = await list(ana, { limit: 1 });
    const second = await list(ana, { limit: 1, cursor: first.body.nextCursor });
    const third = await list(ana, { limit: 1, cursor: second.body.nextCursor });

    expect(first.body.nextCursor).toBe(messageId);
    expect([...ids(first.body), ...ids(second.body), ...ids(third.body)]).toEqual([
      withBruno,
      withCarla,
      group,
    ]);
    expect(third.body.nextCursor).toBeNull();
  });

  it('should search groups by title and direct chats by name or nickname', async () => {
    const [byTitle, byName, byNickname] = await Promise.all([
      list(ana, { search: 'viag' }),
      list(ana, { search: 'Bruno Li' }),
      list(ana, { search: 'carl' }),
    ]);

    expect(ids(byTitle.body)).toEqual([group]);
    expect(ids(byName.body)).toEqual([withBruno]);
    expect(ids(byNickname.body)).toEqual([withCarla]);
  });

  it('should filter direct chats and groups by type', async () => {
    const [direct, groups] = await Promise.all([
      list(ana, { type: 'direct' }),
      list(ana, { type: 'group' }),
    ]);

    expect(ids(direct.body)).toEqual([withBruno, withCarla]);
    expect(ids(groups.body)).toEqual([group]);
  });

  it('should combine the type filter with the search', async () => {
    const response = await list(ana, { type: 'direct', search: 'viag' });

    expect(ids(response.body)).toEqual([]);
  });

  it('should return 400 when type is unknown', async () => {
    const response = await list(ana, { type: 'channel' });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Tipo de Chat inválido');
  });

  it('should treat a blank search as no search', async () => {
    const response = await list(ana, { search: '  ' });

    expect(ids(response.body)).toHaveLength(3);
  });

  it('should return 400 when search has fewer than 2 characters', async () => {
    const response = await list(ana, { search: 'a' });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Busca deve ter no mínimo 2 caracteres');
  });

  it('should return only the chats of the user', async () => {
    const dani = await createUser('Daniel Costa', 'dani');

    const response = await list(dani);

    expect(response.body.data).toEqual([]);
  });
});
