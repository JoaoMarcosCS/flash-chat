'use client';

import { useLoginForm } from '../hooks/use-login-form';
import { FormError } from '@/components/common/form-error';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Spinner } from '@/components/ui/spinner';
import { RenderIf } from '@/components/common/render-if';

export function LoginForm() {
  const { form, onSubmit, isPending, apiError } = useLoginForm();
  const { errors } = form.formState;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FormError message={apiError} />
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
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          aria-describedby="password-error"
          {...form.register('password')}
        />
      </Field>
      <Button type="submit" disabled={isPending} className="mt-2">
        <RenderIf shouldRender={isPending} fallback="Entrar">
          <Spinner className="text-inverse-foreground" />
        </RenderIf>
      </Button>
    </form>
  );
}
