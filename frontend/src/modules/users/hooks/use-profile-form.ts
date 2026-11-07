import { useState } from 'react';
import axios from 'axios';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { UserProfile } from '../interface/user.interface';
import { UpdateProfileSchema, type UpdateProfileDTO } from '../schema/update-profile.schema';
import type { UpdateProfileBody } from '../service/update-profile.request';
import { useUpdateProfileMutation } from './use-update-profile-mutation';
import { getApiErrorMessage } from '@/lib/get-api-error-message';

const INVALID_CURRENT_PASSWORD = 'Senha atual incorreta';

type ProfileChanges = Omit<UpdateProfileBody, 'currentPassword'>;

function toFormValues({ name, nickname, email }: UserProfile): UpdateProfileDTO {
  return { name, nickname, email, password: '' };
}

function getChanges(values: UpdateProfileDTO, profile: UserProfile): ProfileChanges {
  const changes: ProfileChanges = {};
  if (values.name !== profile.name) changes.name = values.name;
  if (values.nickname !== profile.nickname) changes.nickname = values.nickname;
  if (values.email !== profile.email) changes.email = values.email;
  if (values.password) changes.password = values.password;
  return changes;
}

export function useProfileForm(profile: UserProfile) {
  const mutation = useUpdateProfileMutation();
  const [pendingChanges, setPendingChanges] = useState<ProfileChanges | null>(null);
  const [saved, setSaved] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const form = useForm<UpdateProfileDTO>({
    resolver: zodResolver(UpdateProfileSchema),
    defaultValues: toFormValues(profile),
  });

  const onSubmit = form.handleSubmit((values) => {
    setSaved(false);
    setFormError(null);
    setDialogError(null);

    const changes = getChanges(values, profile);
    if (Object.keys(changes).length === 0) {
      setFormError('Nenhuma alteração para salvar');
      return;
    }

    setPendingChanges(changes);
  });

  const confirm = (currentPassword: string) => {
    if (!pendingChanges) return;

    mutation.mutate(
      { ...pendingChanges, currentPassword },
      {
        onSuccess: (updated) => {
          setPendingChanges(null);
          setSaved(true);
          form.reset(toFormValues(updated));
        },
        onError: (error) => {
          const message = getApiErrorMessage(error);
          if (message === INVALID_CURRENT_PASSWORD) {
            setDialogError(message);
            return;
          }

          setPendingChanges(null);
          if (axios.isAxiosError(error) && error.response?.status === 409) {
            form.setError(message.startsWith('E-mail') ? 'email' : 'nickname', { message });
            return;
          }
          setFormError(message);
        },
      },
    );
  };

  return {
    form,
    onSubmit,
    saved,
    formError,
    dialog: {
      open: pendingChanges !== null,
      error: dialogError,
      isPending: mutation.isPending,
      confirm,
      cancel: () => setPendingChanges(null),
    },
  };
}
