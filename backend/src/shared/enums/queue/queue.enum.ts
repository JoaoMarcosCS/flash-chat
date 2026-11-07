export enum Exchange {
  EVENTS = 'flash-chat.events',
}

export enum RoutingKey {
  MESSAGE_PUBLISHED = 'message.published',
  MESSAGE_PERSISTED = 'message.persisted',
  MESSAGE_EDITED = 'message.edited',
  MESSAGE_DELETED = 'message.deleted',
  CHAT_CREATED = 'chat.created',
}

export enum QueueName {
  MESSAGES_PERSIST = 'messages.persist',
  WS_EVENTS = 'ws.events',
}
