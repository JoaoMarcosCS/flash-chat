'use client';

import { useRegisterForm } from '../hooks/use-register-form';
import { FormError } from '@/components/common/form-error';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Spinner } from '@/components/ui/spinner';
import { RenderIf } from '@/components/common/render-if';

export function RegisterForm() {
  const { form, onSubmit, isPending, apiError } = useRegisterForm();
  const { errors } = form.formState;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FormError message={apiError} />
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
      <Field id="password" label="Senha" error={errors.password?.message}>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          aria-invalid={!!errors.password}
          aria-describedby="password-error"
          {...form.register('password')}
        />
      </Field>
      <p className="-mt-2 px-1 text-xs text-muted-foreground">
        De 6 a 15 caracteres, com maiúscula, minúscula, número e símbolo.
      </p>
      <Button type="submit" disabled={isPending} className="mt-2">
        <RenderIf shouldRender={isPending} fallback="Criar conta">
          <Spinner className="text-inverse-foreground" />
        </RenderIf>
      </Button>
    </form>
  );
}
