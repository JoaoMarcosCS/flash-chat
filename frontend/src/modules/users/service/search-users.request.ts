import type { PublicUser } from '../interface/user.interface';
import { api } from '@/lib/api';
import type { Paginated } from '@/lib/paginated';

interface SearchUsersParams {
  search: string;
  cursor?: string;
}

export async function searchUsersRequest(
  params: SearchUsersParams,
): Promise<Paginated<PublicUser>> {
  const { data } = await api.get<Paginated<PublicUser>>('/users', { params });
  return data;
}
