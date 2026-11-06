import { z } from 'zod';

export const GROUP_MIN_PARTICIPANT_IDS = 2;

export const GROUP_MAX_PARTICIPANT_IDS = 49;

export const GROUP_TITLE_MAX_LENGTH = 100;

const PARTICIPANTS_RANGE_MESSAGE = 'Group deve ter de 3 a 50 Participants';

export const CreateGroupSchema = z.object({
  title: z
    .string('Título é obrigatório')
    .trim()
    .overwrite((value) => value.replace(/ {2,}/g, ' '))
    .min(1, 'Título é obrigatório')
    .max(GROUP_TITLE_MAX_LENGTH, 'Título deve ter no máximo 100 caracteres')
    .refine(
      (value) => !/\p{Cc}/u.test(value),
      'Título não pode conter quebras de linha ou tabulações',
    ),
  participantIds: z
    .array(z.uuid('Participant inválido'))
    .min(GROUP_MIN_PARTICIPANT_IDS, PARTICIPANTS_RANGE_MESSAGE)
    .max(GROUP_MAX_PARTICIPANT_IDS, PARTICIPANTS_RANGE_MESSAGE),
});

export type CreateGroupDTO = z.infer<typeof CreateGroupSchema>;
