import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type { RegisterDTO } from '../schema/register.schema';
import { loginRequest } from '../service/login.request';
import { registerRequest } from '../service/register.request';
import { startSession } from '../session/session';

async function registerAndLogin(body: RegisterDTO) {
  await registerRequest(body);
  return loginRequest({ email: body.email, password: body.password });
}

export function useRegisterMutation() {
  const router = useRouter();

  return useMutation({
    mutationFn: registerAndLogin,
    onSuccess: ({ accessToken }) => {
      startSession(accessToken);
      router.replace('/chats');
    },
  });
}
