import { describe, expect, it } from 'vitest';
import supertest from 'supertest';
import { app } from '@/infra/http/index';
import { AppDataSource } from '@/infra/database/data-source';
import { UserEntity } from '@/modules/users/entity/user.entity';
import { hash } from '@/shared/utils/hash';

const validPayload = {
  name: 'John Doe',
  nickname: 'john.doe',
  email: 'john.doe@example.com',
  password: '@Password123',
};

describe('POST /api/v1/users (integração - validação do schema Zod)', () => {
  it('should return 400 when email is invalid', async () => {
    const response = await supertest(app)
      .post('/api/v1/users')
      .send({ ...validPayload, email: 'not-an-email' });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('E-mail inválido');
  });

  it('should return 400 when password has no symbol', async () => {
    const response = await supertest(app)
      .post('/api/v1/users')
      .send({ ...validPayload, password: 'Password1' });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Senha deve conter ao menos um símbolo como @, #, &');
  });
});

describe('POST /api/v1/users (integração - persistência no banco)', () => {
  it('should persist the user in the database', async () => {
    const response = await supertest(app).post('/api/v1/users').send(validPayload);

    expect(response.status).toBe(201);

    const userInDb = await AppDataSource.getRepository(UserEntity).findOne({
      where: { email: validPayload.email },
      select: ['id', 'name', 'nickname', 'email', 'password', 'status'],
    });

    expect(userInDb).not.toBeNull();
    expect(userInDb?.name).toBe(validPayload.name);
    expect(userInDb?.nickname).toBe(validPayload.nickname);
    expect(userInDb?.status).toBe(1);
    expect(userInDb?.password).not.toBe(validPayload.password);
    expect(await hash.compare(validPayload.password, userInDb!.password)).toBe(true);
  });
});
