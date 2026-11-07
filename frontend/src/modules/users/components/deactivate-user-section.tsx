'use client';

import { useState } from 'react';
import { useDeactivateUserMutation } from '../hooks/use-deactivate-user-mutation';
import { CurrentPasswordDialog } from './current-password-dialog';
import { Button } from '@/components/ui/button';
import { getApiErrorMessage } from '@/lib/get-api-error-message';

export function DeactivateUserSection() {
  const mutation = useDeactivateUserMutation();
  const [confirming, setConfirming] = useState(false);

  const open = () => {
    mutation.reset();
    setConfirming(true);
  };

  return (
    <section
      aria-labelledby="deactivate-user-title"
      className="flex flex-col gap-3 border-t border-border pt-8"
    >
      <h3 id="deactivate-user-title" className="text-base font-semibold text-foreground">
        Desativar conta
      </h3>
      <p className="text-sm text-muted-foreground">
        A desativação é permanente e não pode ser desfeita. Você não vai conseguir entrar de novo, e
        seu e-mail e seu Nickname continuam ocupados. Suas conversas diretas ficam somente leitura.
      </p>
      <Button variant="outline" className="self-start" onClick={open}>
        Desativar conta
      </Button>
      <CurrentPasswordDialog
        open={confirming}
        title="Desativar conta de vez?"
        description="Essa ação é irreversível: não existe reativação. Digite sua senha atual para confirmar."
        confirmLabel="Desativar conta"
        isPending={mutation.isPending || mutation.isSuccess}
        error={mutation.isError ? getApiErrorMessage(mutation.error) : null}
        onConfirm={(currentPassword) => mutation.mutate(currentPassword)}
        onCancel={() => setConfirming(false)}
      />
    </section>
  );
}
