'use client';

import type { UserProfile } from '../interface/user.interface';
import { useProfileForm } from '../hooks/use-profile-form';
import { CurrentPasswordDialog } from './current-password-dialog';
import { FormError } from '@/components/common/form-error';
import { RenderIf } from '@/components/common/render-if';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';

interface ProfileFormProps {
  profile: UserProfile;
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const { form, onSubmit, saved, formError, dialog } = useProfileForm(profile);
  const { errors, isDirty } = form.formState;

  return (
    <>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <FormError message={formError} />
        <RenderIf shouldRender={saved && !isDirty}>
          <p role="status" className="text-sm text-muted-foreground">
            Dados atualizados.
          </p>
        </RenderIf>
        <Field id="name" label="Nome" error={errors.name?.message}>
          <Input
            id="name"
            autoComplete="name"
            aria-invalid={!!errors.name}
            aria-describedby="name-error"
            {...form.register('name')}
          />
        </Field>
        <Field id="nickname" label="Nickname" error={errors.nickname?.message}>
          <Input
            id="nickname"
            autoComplete="username"
            aria-invalid={!!errors.nickname}
            aria-describedby="nickname-error"
            {...form.register('nickname')}
          />
        </Field>
        <Field id="email" label="E-mail" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            aria-describedby="email-error"
            {...form.register('email')}
          />
        </Field>
        <Field id="password" label="Nova senha" error={errors.password?.message}>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            aria-describedby="password-error"
            {...form.register('password')}
          />
        </Field>
        <p className="-mt-2 px-1 text-xs text-muted-foreground">
          Deixe em branco para manter a senha atual. De 6 a 15 caracteres, com maiúscula, minúscula,
          número e símbolo.
        </p>
        <Button type="submit" disabled={!isDirty || dialog.open} className="mt-2 self-start">
          Finalizar edição
        </Button>
      </form>
      <CurrentPasswordDialog
        open={dialog.open}
        title="Confirmar edição"
        description="Digite sua senha atual para salvar as alterações."
        confirmLabel="Salvar"
        isPending={dialog.isPending}
        error={dialog.error}
        onConfirm={dialog.confirm}
        onCancel={dialog.cancel}
      />
    </>
  );
}
