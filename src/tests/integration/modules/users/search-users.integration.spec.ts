import { beforeEach, describe, expect, it } from 'vitest';
import supertest from 'supertest';
import { app } from '@/infra/http/index';
import { AppDataSource } from '@/infra/database/data-source';
import { v7 as uuidv7 } from 'uuid';
import { UserEntity } from '@/modules/users/entity/user.entity';
import { UserStatus } from '@/shared/enums/users/user-status.enum';
import { generateTokens } from '@/modules/auth/token/token';

const users = [
  { name: 'Ana Souza', nickname: 'ana.souza', email: 'ana.souza@example.com' },
  { name: 'Bruno Lima', nickname: 'brunao', email: 'bruno.lima@example.com' },
  { name: 'Carla Souza', nickname: 'carla_s', email: 'carla@example.com' },
  { name: 'Daniel Costa', nickname: 'dcosta', email: 'daniel.costa@test.com' },
  { name: 'Eva Rocha', nickname: 'eva.rocha', email: 'eva.rocha@example.com' },
];

const deactivatedUser = {
  name: 'Fábio Souza',
  nickname: 'fabio.souza',
  email: 'fabio@example.com',
  status: UserStatus.DEACTIVATED,
};

const { accessToken } = generateTokens({
  id: '6f1c2b8e-1d4a-4b6e-9a3f-2c1d0e9b8a7f',
  name: 'Admin',
  nickname: 'admin',
});

const search = (query: Record<string, string | number> = {}) =>
  supertest(app).get('/api/v1/users').query(query).set('Authorization', `Bearer ${accessToken}`);

const names = (body: { data: UserEntity[] }) => body.data.map((user) => user.name);

describe('GET /api/v1/users (integração)', () => {
  beforeEach(async () => {
    const repository = AppDataSource.getRepository(UserEntity);

    await repository.save(
      [...users, deactivatedUser].map((user) =>
        repository.create({ ...user, id: uuidv7(), password: 'hashed' }),
      ),
    );
  });

  it('should return 401 without token', async () => {
    const response = await supertest(app).get('/api/v1/users');

    expect(response.status).toBe(401);
  });

  it('should return 400 when search is missing', async () => {
    const response = await search();

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Busca é obrigatória');
  });

  it('should return 400 when search has fewer than 2 characters', async () => {
    const response = await search({ search: 'a' });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Busca deve ter no mínimo 2 caracteres');
  });

  it('should return the first page with default limit when no cursor is provided', async () => {
    const response = await search({ search: 'souza' });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data[0]).not.toHaveProperty('password');
    expect(response.body.data[0]).not.toHaveProperty('email');
    expect(response.body.nextCursor).toBeNull();
  });

  it('should paginate with cursor without repeating or skipping users', async () => {
    const collected: string[] = [];
    let cursor: string | null = null;

    do {
      const query = { search: 'souza', limit: 1 };
      const response = await search(cursor ? { ...query, cursor } : query);

      expect(response.status).toBe(200);
      collected.push(...names(response.body));
      cursor = response.body.nextCursor;
    } while (cursor);

    expect([...collected].sort()).toEqual(['Ana Souza', 'Carla Souza']);
  });

  it('should search by partial name ignoring deactivated users', async () => {
    const response = await search({ search: 'souz' });

    expect(names(response.body).sort()).toEqual(['Ana Souza', 'Carla Souza']);
  });

  it('should search by partial nickname', async () => {
    const response = await search({ search: 'dcost' });

    expect(names(response.body)).toEqual(['Daniel Costa']);
  });

  it('should not search by e-mail', async () => {
    const response = await search({ search: 'daniel.costa@test.com' });

    expect(names(response.body)).toEqual([]);
  });

  it('should return 400 for invalid cursor', async () => {
    const response = await search({ search: 'souza', cursor: 'invalid' });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Cursor inválido');
  });
});
