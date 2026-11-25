'use client';

import type { UserProfile } from '../interface/user.interface';
import { useProfileForm } from '../hooks/use-profile-form';
import { CurrentPasswordDialog } from './current-password-dialog';
import { FormError } from '@/components/common/form-error';
import { RenderIf } from '@/components/common/render-if';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
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
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <FormError message={formError} />
        <RenderIf shouldRender={saved && !isDirty}>
          <p role="status" className="text-sm text-muted-foreground">
            Dados atualizados.
          </p>
        </RenderIf>
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="name">Nome</FieldLabel>
          <Input
            id="name"
            autoComplete="name"
            aria-invalid={!!errors.name}
            {...form.register('name')}
          />
          <FieldError errors={[errors.name]} />
        </Field>
        <Field data-invalid={!!errors.nickname}>
          <FieldLabel htmlFor="nickname">Nickname</FieldLabel>
          <Input
            id="nickname"
            autoComplete="username"
            aria-invalid={!!errors.nickname}
            {...form.register('nickname')}
          />
          <FieldError errors={[errors.nickname]} />
        </Field>
        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="email">E-mail</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            {...form.register('email')}
          />
          <FieldError errors={[errors.email]} />
        </Field>
        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="password">Nova senha</FieldLabel>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            {...form.register('password')}
          />
          <FieldError errors={[errors.password]} />
        </Field>
        <FieldDescription className="-mt-2">
          Deixe em branco para manter a senha atual. De 6 a 15 caracteres, com maiúscula, minúscula,
          número e símbolo.
        </FieldDescription>
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
