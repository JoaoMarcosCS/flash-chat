import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { RegisterSchema, type RegisterDTO } from '../schema/register.schema';
import { useRegisterMutation } from './use-register-mutation';
import { useResetOnHide } from '@/hooks/use-reset-on-hide';
import { getApiErrorMessage } from '@/lib/get-api-error-message';

export function useRegisterForm() {
  const mutation = useRegisterMutation();
  const form = useForm<RegisterDTO>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { name: '', nickname: '', email: '', password: '' },
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
