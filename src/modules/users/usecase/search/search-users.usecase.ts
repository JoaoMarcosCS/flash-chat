import { inject, injectable } from 'tsyringe';
import { IUserRepository } from '../../repository/IUserRepository';
import { SearchUsersDTO, TSQUERY_SPECIAL_CHARACTERS } from './search-users.schema';
import { PublicUser } from '../../repository/IUserRepository';

export type SearchUsersResponse = {
  data: PublicUser[];
  nextCursor: string | null;
};

export const buildTsQuery = (search?: string): string | undefined => {
  if (!search) {
    return undefined;
  }

  const tokens = search
    .toLowerCase()
    .replace(TSQUERY_SPECIAL_CHARACTERS, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => `${token}:*`);

  return tokens.length ? tokens.join(' & ') : undefined;
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
