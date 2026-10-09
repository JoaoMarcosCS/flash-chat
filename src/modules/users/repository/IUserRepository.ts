import { UserEntity } from '../entity/user.entity';

export type FindUsersByParams = {
  columns?: Partial<Pick<UserEntity, 'id' | 'email' | 'nickname'>>;
  value?: string;
  cursor?: string;
  limit?: number;
};

export type CreateUserData = Pick<UserEntity, 'name' | 'nickname' | 'email' | 'password'>;

export type PublicUser = Pick<UserEntity, 'id' | 'name' | 'nickname' | 'status'>;

export interface IUserRepository {
  create(data: CreateUserData): Promise<PublicUser>;
  findBy(params: FindUsersByParams): Promise<PublicUser[]>;
  findByEmailWithPassword(email: string): Promise<UserEntity | null>;
}
