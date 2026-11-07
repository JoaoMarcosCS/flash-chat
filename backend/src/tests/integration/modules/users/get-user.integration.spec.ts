import { beforeEach, describe, expect, it } from 'vitest';
import supertest from 'supertest';
import { app } from '@/infra/http/index';
import { AppDataSource } from '@/infra/database/data-source';
import { UserEntity } from '@/modules/users/entity/user.entity';
import { UserStatus } from '@/shared/enums/users/user-status.enum';
import { createMeUser, getMe, MeUser } from './user-fixtures';

describe('GET /api/v1/users/me (integração)', () => {
  let ana: MeUser;

  beforeEach(async () => {
    ana = await createMeUser();
  });

  it('should return 401 without token', async () => {
    const response = await supertest(app).get('/api/v1/users/me');

    expect(response.status).toBe(401);
  });

  it('should return the profile with the e-mail and without the password', async () => {
    const response = await getMe(ana);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: ana.id,
      name: 'Ana Souza',
      nickname: 'ana',
      email: ana.email,
    });
  });

  it('should return 401 for a deactivated user with a valid token', async () => {
    await AppDataSource.getRepository(UserEntity).update(ana.id, {
      status: UserStatus.DEACTIVATED,
    });

    const response = await getMe(ana);

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Token inválido');
  });
});
