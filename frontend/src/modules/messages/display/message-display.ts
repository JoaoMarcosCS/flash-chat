import type { ChatMessage } from '../interface/message.interface';

export const DELETED_MESSAGE_LABEL = 'Mensagem apagada';

export function isDeleted(message: ChatMessage): boolean {
  return message.contentStatus === 'deleted';
}

export function canChange(message: ChatMessage, isOwn: boolean, readOnly: boolean): boolean {
  return isOwn && !readOnly && message.status === 'persisted' && !isDeleted(message);
}
