import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IUserRepository, PublicUser } from '../../repository/IUserRepository';
import { buildTsQuery, SearchUsersUseCase } from './search-users.usecase';
import { SEARCH_USERS_DEFAULT_LIMIT, SearchUsersSchema } from './search-users.schema';
import { UserStatus } from '../../entity/user.entity';

const makeUser = (id: string): PublicUser => ({
  id,
  name: 'John Doe',
  nickname: 'john.doe',
  status: UserStatus.ACTIVE,
});

const cursor = '6f1c2b8e-1d4a-4b6e-9a3f-2c1d0e9b8a7f';

const mockRepository = (): IUserRepository => ({
  findBy: vi.fn().mockResolvedValue([]),
  findByEmailWithPassword: vi.fn(),
  create: vi.fn(),
});

describe('SearchUsersUseCase', () => {
  let repository: IUserRepository;
  let useCase: SearchUsersUseCase;

  beforeEach(() => {
    repository = mockRepository();
    useCase = new SearchUsersUseCase(repository);
  });

  it('should use default limit and no cursor when none is provided', async () => {
    await useCase.execute(SearchUsersSchema.parse({}));

    expect(repository.findBy).toHaveBeenCalledWith({
      value: undefined,
      cursor: undefined,
      limit: SEARCH_USERS_DEFAULT_LIMIT + 1,
    });
  });

  it('should pass the cursor id and the tsquery', async () => {
    await useCase.execute({ search: 'John do', cursor, limit: 10 });

    expect(repository.findBy).toHaveBeenCalledWith({
      value: 'john:* & do:*',
      cursor,
      limit: 11,
    });
  });

  it('should return the last id as nextCursor when there is a next page', async () => {
    vi.mocked(repository.findBy).mockResolvedValueOnce([
      makeUser('c'),
      makeUser('b'),
      makeUser('a'),
    ]);

    const result = await useCase.execute({ limit: 2 });

    expect(result.data.map((user) => user.id)).toEqual(['c', 'b']);
    expect(result.nextCursor).toBe('b');
  });

  it('should return null nextCursor on the last page', async () => {
    vi.mocked(repository.findBy).mockResolvedValueOnce([makeUser('b'), makeUser('a')]);

    const result = await useCase.execute({ limit: 2 });

    expect(result.data).toHaveLength(2);
    expect(result.nextCursor).toBeNull();
  });
});

describe('buildTsQuery', () => {
  it('should keep nickname tokens intact', () => {
    expect(buildTsQuery('John_Doe.99')).toBe('john_doe.99:*');
  });

  it('should remove tsquery special characters', () => {
    expect(buildTsQuery("john' & (doe):* | !x")).toBe('john:* & doe:* & x:*');
  });

  it('should keep e-mail tokens intact', () => {
    expect(buildTsQuery('John.Doe@example.com')).toBe('john.doe@example.com:*');
  });

  it('should return undefined when no token remains', () => {
    expect(buildTsQuery('')).toBeUndefined();
    expect(buildTsQuery('&|!')).toBeUndefined();
  });
});

describe('SearchUsersSchema', () => {
  it('should reject limit greater than 100', () => {
    expect(SearchUsersSchema.safeParse({ limit: '101' }).success).toBe(false);
  });

  it('should coerce limit from query string', () => {
    expect(SearchUsersSchema.parse({ limit: '5' }).limit).toBe(5);
  });

  it('should reject a cursor that is not an uuid', () => {
    expect(SearchUsersSchema.safeParse({ cursor: 'invalid' }).success).toBe(false);
  });
});
