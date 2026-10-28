import { inject, injectable } from 'tsyringe';
import { IUserRepository } from '../../repository/IUserRepository';
import { SearchUsersDTO } from './search-users.schema';
import { buildTsQuery } from '@/shared/utils/build-ts-query';
import { PublicUser } from '../../repository/IUserRepository';

export type SearchUsersResponse = {
  data: PublicUser[];
  nextCursor: string | null;
};

@injectable()
export class SearchUsersUseCase {
  constructor(@inject('IUserRepository') private userRepository: IUserRepository) {}

  async execute(
    { search, cursor, limit }: SearchUsersDTO,
    userId: string,
  ): Promise<SearchUsersResponse> {
    const users = await this.userRepository.findBy({
      excludeIds: [userId],
      value: buildTsQuery(search),
      cursor,
      limit: limit + 1,
    });

    const hasNextPage = users.length > limit;
    const data = hasNextPage ? users.slice(0, limit) : users;

    return {
      data,
      nextCursor: hasNextPage ? data[data.length - 1].id : null,
    };
  }
}
