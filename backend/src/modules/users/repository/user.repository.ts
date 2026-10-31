import { QueryFailedError, Repository } from 'typeorm';
import { v7 as uuidv7 } from 'uuid';
import {
  CreateUserData,
  FindUsersByParams,
  IUserRepository,
  PublicUser,
} from './user-repository.interface';
import { AppDataSource } from '@/infra/database/data-source';
import { UserEntity } from '../entity/user.entity';
import { UserStatus } from '@/shared/enums/users/user-status.enum';
import { MessageError } from '@/shared/enums/erros.enum';
import { ConflictException } from '@/shared/errors/errors';

const SEARCH_VECTOR = `to_tsvector('simple', coalesce(u.name, '') || ' ' || coalesce(u.nickname, ''))`;

const UNIQUE_VIOLATION = '23505';

const UNIQUE_CONSTRAINT_ERRORS: Record<string, MessageError> = {
  UQ_users_email: MessageError.EMAIL_ALREADY_EXISTS,
  UQ_users_nickname: MessageError.NICKNAME_ALREADY_EXISTS,
};

export class UserRepository implements IUserRepository {
  private repository: Repository<UserEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(UserEntity);
  }

  async findBy({
    ids,
    columns,
    statusValues = [UserStatus.ACTIVE],
    excludeIds,
    value,
    cursor,
    limit,
  }: FindUsersByParams): Promise<PublicUser[]> {
    const builder = this.repository
      .createQueryBuilder('u')
      .select(['u.id', 'u.name', 'u.nickname', 'u.status'])
      .where('u.status IN (:...statusValues)', { statusValues })
      .orderBy('u.id', 'DESC')
      .limit(ids?.length || limit || 20);

    if (ids?.length) {
      builder.andWhere('u.id IN (:...ids)', { ids });
    }

    if (columns?.email) {
      builder.andWhere('lower(u.email) = lower(:email)', { email: columns.email });
    }

    if (columns?.nickname) {
      builder.andWhere('lower(u.nickname) = lower(:nickname)', { nickname: columns.nickname });
    }

    if (excludeIds?.length) {
      builder.andWhere('u.id NOT IN (:...excludeIds)', { excludeIds });
    }

    if (value) {
      builder.andWhere(`${SEARCH_VECTOR} @@ to_tsquery('simple', :value)`, { value });
    }

    if (cursor) {
      builder.andWhere('u.id < :cursor', { cursor });
    }

    return await builder.getMany();
  }

  async findByEmailWithPassword(email: string): Promise<UserEntity | null> {
    return await this.repository
      .createQueryBuilder('u')
      .select(['u.id', 'u.name', 'u.nickname', 'u.password'])
      .where('lower(u.email) = lower(:email)', { email })
      .andWhere('u.status = :status', { status: UserStatus.ACTIVE })
      .getOne();
  }

  async create(data: CreateUserData): Promise<PublicUser> {
    try {
      const { raw } = await this.repository
        .createQueryBuilder()
        .insert()
        .into(UserEntity)
        .values({ id: uuidv7(), ...data })
        .updateEntity(false)
        .returning(['id', 'name', 'nickname', 'status'])
        .execute();

      return raw[0];
    } catch (error) {
      const conflict = getUniqueConflict(error);

      if (conflict) {
        throw new ConflictException(conflict);
      }

      throw error;
    }
  }
}

const getUniqueConflict = (error: unknown): MessageError | undefined => {
  if (!(error instanceof QueryFailedError)) {
    return undefined;
  }

  const { code, constraint } = error.driverError as { code?: string; constraint?: string };

  return code === UNIQUE_VIOLATION && constraint ? UNIQUE_CONSTRAINT_ERRORS[constraint] : undefined;
};
