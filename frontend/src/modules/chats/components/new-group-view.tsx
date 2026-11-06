'use client';

import { Check, X } from 'lucide-react';
import { useCreateGroupForm } from '../hooks/use-create-group-form';
import {
  GROUP_MAX_PARTICIPANT_IDS,
  GROUP_MIN_PARTICIPANT_IDS,
  GROUP_TITLE_MAX_LENGTH,
} from '../schema/create-group.schema';
import { RenderIf } from '@/components/common/render-if';
import { RenderItems } from '@/components/common/render-items';
import { PanelHeader } from '@/components/layout/panel-header';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { FormError } from '@/components/common/form-error';
import { UserSearch } from '@/modules/users/components/user-search';

export function NewGroupView() {
  const {
    form,
    participants,
    toggleParticipant,
    canSubmit,
    canAddMore,
    pendingGroup,
    onSubmit,
    confirm,
    cancel,
    isPending,
    apiError,
  } = useCreateGroupForm();
  const { errors } = form.formState;
  const isSelected = (id: string) => participants.some((participant) => participant.id === id);

  return (
    <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
      <PanelHeader
        backHref="/groups"
        actions={
          <Button type="submit" size="sm" disabled={!canSubmit || isPending}>
            <RenderIf shouldRender={isPending} fallback="Criar grupo">
              <Spinner className="text-inverse-foreground" />
            </RenderIf>
          </Button>
        }
      >
        <h2 className="text-lg font-semibold text-foreground">Novo grupo</h2>
      </PanelHeader>
      <div className="flex flex-col gap-4 border-b border-border px-4 py-4 md:px-6">
        <FormError message={apiError ?? errors.participantIds?.message ?? null} />
        <Field id="title" label="Nome do grupo" error={errors.title?.message}>
          <Input
            id="title"
            maxLength={GROUP_TITLE_MAX_LENGTH}
            aria-invalid={!!errors.title}
            aria-describedby="title-error"
            className="bg-surface"
            {...form.register('title')}
          />
        </Field>
        <div className="flex flex-col gap-2">
          <p className="px-1 text-sm text-muted-foreground">
            {participants.length} selecionados, de {GROUP_MIN_PARTICIPANT_IDS} a{' '}
            {GROUP_MAX_PARTICIPANT_IDS} além de você
          </p>
          <ul className="flex flex-wrap gap-2">
            <RenderItems items={participants} getKey={(participant) => participant.id}>
              {(participant) => (
                <li>
                  <button
                    type="button"
                    onClick={() => toggleParticipant(participant)}
                    aria-label={`Remover ${participant.name}`}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-surface py-1 pr-2 pl-3 text-sm font-medium text-foreground transition-colors duration-150 hover:border-foreground"
                  >
                    {participant.name}
                    <X className="size-3.5" />
                  </button>
                </li>
              )}
            </RenderItems>
          </ul>
        </div>
      </div>
      <UserSearch
        onSelect={toggleParticipant}
        isSelected={(user) => isSelected(user.id)}
        isDisabled={(user) => !canAddMore && !isSelected(user.id)}
        trailing={(user) => (
          <span
            className={cn(
              'flex size-5 shrink-0 items-center justify-center rounded-[5px] border transition-colors duration-150',
              isSelected(user.id)
                ? 'border-inverse bg-inverse text-inverse-foreground'
                : 'border-muted-foreground/50',
            )}
          >
            <RenderIf shouldRender={isSelected(user.id)}>
              <Check className="size-3.5" strokeWidth={3} />
            </RenderIf>
          </span>
        )}
      />
      <ConfirmDialog
        open={pendingGroup !== null}
        title="Criar grupo?"
        description={
          <>
            O grupo <span className="font-medium text-foreground">{pendingGroup?.title}</span> será
            criado com você e mais {participants.length} participantes.
          </>
        }
        confirmLabel="Criar grupo"
        onConfirm={confirm}
        onCancel={cancel}
      />
    </form>
  );
}
