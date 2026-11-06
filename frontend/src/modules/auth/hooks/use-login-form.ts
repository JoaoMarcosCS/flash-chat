import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { LoginSchema, type LoginDTO } from '../schema/login.schema';
import { useLoginMutation } from './use-login-mutation';
import { useResetOnHide } from '@/hooks/use-reset-on-hide';
import { getApiErrorMessage } from '@/lib/get-api-error-message';

export function useLoginForm() {
  const mutation = useLoginMutation();
  const form = useForm<LoginDTO>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: '', password: '' },
  });

  useResetOnHide(() => {
    form.reset();
    mutation.reset();
  });

  return {
    form,
    onSubmit: form.handleSubmit((values) => mutation.mutate(values)),
    isPending: mutation.isPending || mutation.isSuccess,
    apiError: mutation.isError ? getApiErrorMessage(mutation.error) : null,
  };
}
