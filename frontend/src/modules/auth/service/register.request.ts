import type { RegisterDTO } from '../schema/register.schema';
import { publicApi } from '@/lib/public-api';

export async function registerRequest(body: RegisterDTO): Promise<void> {
  await publicApi.post('/users', body);
}
