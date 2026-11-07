import { api } from '@/lib/api';

export async function deactivateUserRequest(currentPassword: string): Promise<void> {
  await api.delete('/users/me', { data: { currentPassword } });
}
