import { describe, expect, it } from 'vitest';
import { UserRepository } from '@/modules/users/repository/user.repository';
import { UserStatus } from '@/shared/enums/users/user-status.enum';
import { ConflictException } from '@/shared/errors/errors';
import { MessageError } from '@/shared/enums/erros.enum';

const payload = {
  name: 'John Doe',
  nickname: 'john.doe',
  email: 'john.doe@example.com',
  password: 'hashed',
};

describe('UserRepository (integração)', () => {
  it('should return only public columns on create', async () => {
    const repository = new UserRepository();

    const user = await repository.create(payload);

    expect(Object.keys(user).sort()).toEqual(['id', 'name', 'nickname', 'status']);
    expect(user).toMatchObject({
      name: payload.name,
      nickname: payload.nickname,
      status: UserStatus.ACTIVE,
    });
  });

  it('should generate time-ordered UUIDv7 ids', async () => {
    const repository = new UserRepository();

    const first = await repository.create(payload);
    const second = await repository.create({
      ...payload,
      nickname: 'jane.doe',
      email: 'jane.doe@example.com',
    });

    expect(first.id[14]).toBe('7');
    expect(second.id > first.id).toBe(true);
  });

  it('should find by e-mail and nickname ignoring case', async () => {
    const repository = new UserRepository();
    await repository.create(payload);

    const [byEmail, byNickname] = await Promise.all([
      repository.findBy({ columns: { email: 'JOHN.DOE@example.com' } }),
      repository.findBy({ columns: { nickname: 'John.Doe' } }),
    ]);

    expect(byEmail).toHaveLength(1);
    expect(byNickname).toHaveLength(1);
  });

  it('should throw ConflictException when e-mail already exists ignoring case', async () => {
    const repository = new UserRepository();
    await repository.create(payload);

    const promise = repository.create({
      ...payload,
      nickname: 'other.nickname',
      email: 'JOHN.DOE@example.com',
    });

    await expect(promise).rejects.toBeInstanceOf(ConflictException);
    await expect(promise).rejects.toThrow(MessageError.EMAIL_ALREADY_EXISTS);
  });

  it('should throw ConflictException when nickname already exists ignoring case', async () => {
    const repository = new UserRepository();
    await repository.create(payload);

    const promise = repository.create({
      ...payload,
      nickname: 'John.Doe',
      email: 'other@example.com',
    });

    await expect(promise).rejects.toBeInstanceOf(ConflictException);
    await expect(promise).rejects.toThrow(MessageError.NICKNAME_ALREADY_EXISTS);
  });
});
