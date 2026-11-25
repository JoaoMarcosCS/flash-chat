'use client';

import { useRegisterForm } from '../hooks/use-register-form';
import { FormError } from '@/components/common/form-error';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';

export function RegisterForm() {
  const { form, onSubmit, isPending, apiError } = useRegisterForm();
  const { errors } = form.formState;

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <FormError message={apiError} />
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
          <FieldLabel htmlFor="password">Senha</FieldLabel>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            {...form.register('password')}
          />
          <FieldDescription>
            De 6 a 15 caracteres, com maiúscula, minúscula, número e símbolo.
          </FieldDescription>
          <FieldError errors={[errors.password]} />
        </Field>
        <Field>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Criando conta...' : 'Criar conta'}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
