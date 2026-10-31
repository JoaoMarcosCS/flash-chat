import {
  Entity,
  PrimaryColumn,
  Column,
  Index,
  Check,
  ManyToOne,
  JoinColumn,
  Relation,
} from 'typeorm';
import { ChatParticipantEntity } from '@/modules/chats/entity/chat-participant.entity';

@Entity('messages')
@Check('CK_messages_content', `char_length("content") BETWEEN 1 AND 1000`)
@Index('IDX_messages_chat', ['chatId', 'id'])
@Index('IDX_messages_search', { synchronize: false })
export class MessageEntity {
  @PrimaryColumn({ type: 'uuid', primaryKeyConstraintName: 'PK_messages_id' })
  id: string;

  @Column({ name: 'chat_id', type: 'uuid' })
  chatId: string;

  @Column({ name: 'sender_id', type: 'uuid' })
  senderId: string;

  @ManyToOne(() => ChatParticipantEntity)
  @JoinColumn([
    {
      name: 'chat_id',
      referencedColumnName: 'chatId',
      foreignKeyConstraintName: 'FK_messages_participant',
    },
    { name: 'sender_id', referencedColumnName: 'userId' },
  ])
  sender: Relation<ChatParticipantEntity>;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
