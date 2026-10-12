import { Repository } from 'typeorm';
import { v7 as uuidv7 } from 'uuid';
import { CreateUserData, FindUsersByParams, IUserRepository, PublicUser } from './IUserRepository';
import { AppDataSource } from '@/infra/database/data-source';
import { UserEntity } from '../entity/user.entity';
import { UserStatus } from '@/shared/enums/users/user-status.enum';

const SEARCH_VECTOR = `to_tsvector('simple', coalesce(u.name, '') || ' ' || coalesce(u.nickname, ''))`;

export class UserRepository implements IUserRepository {
  private repository: Repository<UserEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(UserEntity);
  }

  async findBy({
    ids,
    columns,
    statusValues = [UserStatus.ACTIVE],
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
    const { raw } = await this.repository
      .createQueryBuilder()
      .insert()
      .into(UserEntity)
      .values({ id: uuidv7(), ...data })
      .updateEntity(false)
      .returning(['id', 'name', 'nickname', 'status'])
      .execute();

    return raw[0];
  }
}
