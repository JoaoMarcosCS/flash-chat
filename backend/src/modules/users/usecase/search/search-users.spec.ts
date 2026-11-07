import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IUserRepository, PublicUser } from '../../repository/user-repository.interface';
import { SearchUsersUseCase } from './search-users.usecase';
import { SEARCH_USERS_DEFAULT_LIMIT, SearchUsersSchema } from './search-users.schema';
import { UserStatus } from '@/shared/enums/users/user-status.enum';

const makeUser = (id: string): PublicUser => ({
  id,
  name: 'John Doe',
  nickname: 'john.doe',
  status: UserStatus.ACTIVE,
});

const cursor = '6f1c2b8e-1d4a-4b6e-9a3f-2c1d0e9b8a7f';

const userId = '0199b7a0-0000-7000-8000-000000000001';

const mockRepository = (): IUserRepository => ({
  findBy: vi.fn().mockResolvedValue([]),
  findByEmailWithPassword: vi.fn(),
  findByIdWithPassword: vi.fn(),
  findProfileById: vi.fn(),
  update: vi.fn(),
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
    await useCase.execute(SearchUsersSchema.parse({ search: 'john' }), userId);

    expect(repository.findBy).toHaveBeenCalledWith({
      excludeIds: [userId],
      value: 'john:*',
      cursor: undefined,
      limit: SEARCH_USERS_DEFAULT_LIMIT + 1,
    });
  });

  it('should pass the cursor id and the tsquery', async () => {
    await useCase.execute({ search: 'John do', cursor, limit: 10 }, userId);

    expect(repository.findBy).toHaveBeenCalledWith({
      excludeIds: [userId],
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

    const result = await useCase.execute({ search: 'john', limit: 2 }, userId);

    expect(result.data.map((user) => user.id)).toEqual(['c', 'b']);
    expect(result.nextCursor).toBe('b');
  });

  it('should return null nextCursor on the last page', async () => {
    vi.mocked(repository.findBy).mockResolvedValueOnce([makeUser('b'), makeUser('a')]);

    const result = await useCase.execute({ search: 'john', limit: 2 }, userId);

    expect(result.data).toHaveLength(2);
    expect(result.nextCursor).toBeNull();
  });
});

describe('SearchUsersSchema', () => {
  it('should reject a missing search', () => {
    const result = SearchUsersSchema.safeParse({});

    expect(result.error?.issues[0].message).toBe('Busca é obrigatória');
  });

  it.each(['', '   ', 'a', ' a ', '&|', 'a!'])('should reject search %j', (search) => {
    const result = SearchUsersSchema.safeParse({ search });

    expect(result.error?.issues[0].message).toBe('Busca deve ter no mínimo 2 caracteres');
  });

  it('should accept and trim a search with 2 characters', () => {
    expect(SearchUsersSchema.parse({ search: ' an ' }).search).toBe('an');
  });

  it('should reject limit greater than 100', () => {
    expect(SearchUsersSchema.safeParse({ search: 'john', limit: '101' }).success).toBe(false);
  });

  it('should coerce limit from query string', () => {
    expect(SearchUsersSchema.parse({ search: 'john', limit: '5' }).limit).toBe(5);
  });

  it('should reject a cursor that is not an uuid', () => {
    expect(SearchUsersSchema.safeParse({ search: 'john', cursor: 'invalid' }).success).toBe(false);
  });
});
