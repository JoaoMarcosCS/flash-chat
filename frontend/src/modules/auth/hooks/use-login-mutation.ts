import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { loginRequest } from '../service/login.request';
import { startSession } from '../session/session';

export function useLoginMutation() {
  const router = useRouter();

  return useMutation({
    mutationFn: loginRequest,
    onSuccess: ({ accessToken }) => {
      startSession(accessToken);
      router.replace('/chats');
    },
  });
}
