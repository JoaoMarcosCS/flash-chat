'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { CurrentPasswordSchema, type CurrentPasswordDTO } from '../schema/update-profile.schema';
import { FormError } from '@/components/common/form-error';
import { RenderIf } from '@/components/common/render-if';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { PasswordInput } from '@/components/ui/password-input';
import { Spinner } from '@/components/ui/spinner';

interface CurrentPasswordDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  isPending: boolean;
  error: string | null;
  onConfirm: (currentPassword: string) => void;
  onCancel: () => void;
}

export function CurrentPasswordDialog({
  open,
  title,
  description,
  confirmLabel,
  isPending,
  error,
  onConfirm,
  onCancel,
}: CurrentPasswordDialogProps) {
  const id = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const form = useForm<CurrentPasswordDTO>({
    resolver: zodResolver(CurrentPasswordSchema),
    defaultValues: { currentPassword: '' },
  });
  const { errors } = form.formState;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      form.reset();
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open, form]);

  const cancel = () => {
    if (!isPending) onCancel();
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={`${id}-title`}
      onCancel={(event) => {
        event.preventDefault();
        cancel();
      }}
      onClick={(event) => event.target === event.currentTarget && cancel()}
      className="m-auto w-[calc(100%-32px)] max-w-sm rounded-xl border border-border bg-surface p-0 text-foreground backdrop:bg-black/30"
    >
      <form
        onSubmit={form.handleSubmit(({ currentPassword }) => onConfirm(currentPassword))}
        noValidate
        className="flex flex-col gap-5 p-6"
      >
        <div className="flex flex-col gap-1.5">
          <h2 id={`${id}-title`} className="text-lg font-semibold">
            {title}
          </h2>
          <div className="text-sm text-muted-foreground">{description}</div>
        </div>
        <FormError message={error} />
        <Field id={`${id}-password`} label="Senha atual" error={errors.currentPassword?.message}>
          <PasswordInput
            id={`${id}-password`}
            autoComplete="current-password"
            aria-invalid={!!errors.currentPassword}
            aria-describedby={`${id}-password-error`}
            {...form.register('currentPassword')}
          />
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" disabled={isPending} onClick={cancel}>
            Cancelar
          </Button>
          <Button type="submit" size="sm" disabled={isPending}>
            <RenderIf shouldRender={isPending} fallback={confirmLabel}>
              <Spinner className="text-inverse-foreground" />
            </RenderIf>
          </Button>
        </div>
      </form>
    </dialog>
  );
}
