import { UserEntity } from '../entity/user.entity';
import { UserStatus } from '@/shared/enums/users/user-status.enum';

export type FindUsersByParams = {
  ids?: string[];
  columns?: Partial<Pick<UserEntity, 'email' | 'nickname'>>;
  statusValues?: UserStatus[];
  excludeIds?: string[];
  value?: string;
  cursor?: string;
  limit?: number;
};

export type CreateUserData = Pick<UserEntity, 'name' | 'nickname' | 'email' | 'password'>;

export type UpdateUserData = Partial<
  Pick<UserEntity, 'name' | 'nickname' | 'email' | 'password' | 'status'>
>;

export type PublicUser = Pick<UserEntity, 'id' | 'name' | 'nickname' | 'status'>;

export type UserProfile = Pick<UserEntity, 'id' | 'name' | 'nickname' | 'email'>;

export interface IUserRepository {
  create(data: CreateUserData): Promise<PublicUser>;
  findBy(params: FindUsersByParams): Promise<PublicUser[]>;
  findByEmailWithPassword(email: string): Promise<UserEntity | null>;
  findByIdWithPassword(id: string): Promise<UserEntity | null>;
  findProfileById(id: string): Promise<UserProfile | null>;
  update(id: string, data: UpdateUserData): Promise<UserProfile>;
}
