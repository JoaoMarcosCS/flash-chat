'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Users } from 'lucide-react';
import { useCreateDirectChatMutation } from '../hooks/use-create-direct-chat-mutation';
import { PanelHeader } from '@/components/layout/panel-header';
import { buttonClassName } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Spinner } from '@/components/ui/spinner';
import { RenderIf } from '@/components/common/render-if';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import { FormError } from '@/components/common/form-error';
import { UserSearch } from '@/modules/users/components/user-search';
import type { PublicUser } from '@/modules/users/interface/user.interface';

export function NewChatView() {
  const mutation = useCreateDirectChatMutation();
  const busy = mutation.isPending || mutation.isSuccess;
  const [selected, setSelected] = useState<PublicUser | null>(null);

  const confirm = () => {
    if (!selected) return;
    mutation.mutate(selected.id);
    setSelected(null);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PanelHeader
        actions={
          <Link href="/groups/new" className={buttonClassName({ variant: 'soft', size: 'sm' })}>
            <Users className="size-4" />
            Novo grupo
          </Link>
        }
      >
        <h2 className="text-lg font-semibold text-foreground">Nova conversa</h2>
        <RenderIf shouldRender={busy}>
          <Spinner />
        </RenderIf>
      </PanelHeader>
      <RenderIf shouldRender={mutation.isError}>
        <div className="px-4 pt-4 md:px-6">
          <FormError message={mutation.isError ? getApiErrorMessage(mutation.error) : null} />
        </div>
      </RenderIf>
      <UserSearch onSelect={(user) => !busy && setSelected(user)} isDisabled={() => busy} />
      <ConfirmDialog
        open={selected !== null}
        title="Iniciar conversa?"
        description={
          <>
            Você vai iniciar uma conversa com{' '}
            <span className="font-medium text-foreground">{selected?.name}</span> (@
            {selected?.nickname}).
          </>
        }
        confirmLabel="Iniciar conversa"
        onConfirm={confirm}
        onCancel={() => setSelected(null)}
      />
    </div>
  );
}
