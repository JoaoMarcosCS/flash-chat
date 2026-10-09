import { Entity, PrimaryColumn, Index } from 'typeorm';

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
}
