import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { addCreatedChat } from '../cache/chats-cache';
import { getChatHref } from '../display/chat-display';
import {
  CreateGroupSchema,
  GROUP_MAX_PARTICIPANT_IDS,
  GROUP_MIN_PARTICIPANT_IDS,
  type CreateGroupDTO,
} from '../schema/create-group.schema';
import { createGroupRequest } from '../service/create-group.request';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import type { PublicUser } from '@/modules/users/interface/user.interface';
import { useSessionStore } from '@/stores/session.store';

export function useCreateGroupForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [participants, setParticipants] = useState<PublicUser[]>([]);
  const [pendingGroup, setPendingGroup] = useState<CreateGroupDTO | null>(null);

  const form = useForm<CreateGroupDTO>({
    resolver: zodResolver(CreateGroupSchema),
    defaultValues: { title: '', participantIds: [] },
  });

  const mutation = useMutation({
    mutationFn: createGroupRequest,
    onSuccess: (chat) => {
      addCreatedChat(queryClient, chat, useSessionStore.getState().user?.id ?? '');
      router.push(getChatHref(chat));
    },
  });

  const toggleParticipant = (user: PublicUser) => {
    const next = participants.some((participant) => participant.id === user.id)
      ? participants.filter((participant) => participant.id !== user.id)
      : [...participants, user];
    setParticipants(next);
    form.setValue(
      'participantIds',
      next.map((participant) => participant.id),
    );
  };

  const title = useWatch({ control: form.control, name: 'title' });
  const canSubmit =
    title.trim().length > 0 &&
    participants.length >= GROUP_MIN_PARTICIPANT_IDS &&
    participants.length <= GROUP_MAX_PARTICIPANT_IDS;

  return {
    form,
    participants,
    toggleParticipant,
    canSubmit,
    canAddMore: participants.length < GROUP_MAX_PARTICIPANT_IDS,
    pendingGroup,
    onSubmit: form.handleSubmit((values) => setPendingGroup(values)),
    confirm: () => {
      if (pendingGroup) mutation.mutate(pendingGroup);
      setPendingGroup(null);
    },
    cancel: () => setPendingGroup(null),
    isPending: mutation.isPending || mutation.isSuccess,
    apiError: mutation.isError ? getApiErrorMessage(mutation.error) : null,
  };
}
