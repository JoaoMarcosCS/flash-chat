import type { ChatMessage } from '../interface/message.interface';
import { isSameDay } from '@/lib/format-date';

export interface MessageRun {
  id: string;
  senderId: string;
  startsDay: boolean;
  date: Date;
  messages: ChatMessage[];
}

export function getMessageKey(message: ChatMessage): string {
  return message.clientId ?? message.id;
}

export function toMessageRuns(newestFirst: ChatMessage[]): MessageRun[] {
  const runs: MessageRun[] = [];

  for (let index = newestFirst.length - 1; index >= 0; index--) {
    const message = newestFirst[index];
    const date = new Date(message.createdAt);
    const current = runs.at(-1);
    const startsDay = !current || !isSameDay(current.date, date);

    if (current && !startsDay && current.senderId === message.sender.id) {
      current.messages.push(message);
      current.id = getMessageKey(message);
      current.date = date;
      continue;
    }

    runs.push({
      id: getMessageKey(message),
      senderId: message.sender.id,
      startsDay,
      date,
      messages: [message],
    });
  }

  return runs;
}
