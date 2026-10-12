import { UserEntity } from '../entity/user.entity';
import { UserStatus } from '@/shared/enums/users/user-status.enum';

export type FindUsersByParams = {
  ids?: string[];
  columns?: Partial<Pick<UserEntity, 'email' | 'nickname'>>;
  statusValues?: UserStatus[];
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
