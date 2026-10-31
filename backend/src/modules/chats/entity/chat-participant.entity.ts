import { Entity, PrimaryColumn, Index, ManyToOne, JoinColumn, Relation } from 'typeorm';
import { UserEntity } from '@/modules/users/entity/user.entity';
import { ChatEntity } from './chat.entity';

@Entity('chat_participants')
@Index('IDX_chat_participants_user', ['userId'])
export class ChatParticipantEntity {
  @PrimaryColumn({
    name: 'chat_id',
    type: 'uuid',
    primaryKeyConstraintName: 'PK_chat_participants',
  })
  chatId: string;

  @PrimaryColumn({
    name: 'user_id',
    type: 'uuid',
    primaryKeyConstraintName: 'PK_chat_participants',
  })
  userId: string;

  @ManyToOne(() => ChatEntity)
  @JoinColumn({ name: 'chat_id', foreignKeyConstraintName: 'FK_chat_participants_chat' })
  chat: Relation<ChatEntity>;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'FK_chat_participants_user' })
  user: Relation<UserEntity>;
}
