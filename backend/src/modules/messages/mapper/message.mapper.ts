import { ChatMessage } from '../repository/message-repository.interface';
import { ContentStatus } from '@/shared/enums/messages/content-status.enum';

export type ContentStatusName = 'original' | 'edited' | 'deleted';

export const CONTENT_STATUS_NAMES: Record<ContentStatus, ContentStatusName> = {
  [ContentStatus.ORIGINAL]: 'original',
  [ContentStatus.EDITED]: 'edited',
  [ContentStatus.DELETED]: 'deleted',
};

export type ChatMessageResponse = Omit<ChatMessage, 'contentStatus'> & {
  contentStatus: ContentStatusName;
};

export const toChatMessageResponse = ({
  contentStatus,
  ...message
}: ChatMessage): ChatMessageResponse => ({
  ...message,
  contentStatus: CONTENT_STATUS_NAMES[contentStatus],
});
