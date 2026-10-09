import { Entity, PrimaryColumn, Column, Index, Check } from 'typeorm';

@Entity('messages')
@Check('CK_messages_content', `char_length("content") BETWEEN 1 AND 1000`)
@Index('IDX_messages_chat', { synchronize: false })
@Index('IDX_messages_search', { synchronize: false })
export class MessageEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'chat_id', type: 'uuid' })
  chatId: string;

  @Column({ name: 'sender_id', type: 'uuid' })
  senderId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
