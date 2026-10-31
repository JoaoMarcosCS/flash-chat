import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Index,
  Unique,
  Check,
  ManyToOne,
  JoinColumn,
  Relation,
} from 'typeorm';
import { UserEntity } from '@/modules/users/entity/user.entity';
import { MessageEntity } from '@/modules/messages/entity/message.entity';

@Entity('chats')
@Unique('UQ_chats_direct_key', ['directKey'])
@Check('CK_chats_title', `"is_group" = ("title" IS NOT NULL)`)
@Check('CK_chats_direct_key', `"is_group" = ("direct_key" IS NULL)`)
@Check(
  'CK_chats_direct_key_order',
  `"direct_key" IS NULL OR split_part("direct_key", ':', 1) < split_part("direct_key", ':', 2)`,
)
@Index('IDX_chats_search', { synchronize: false })
export class ChatEntity {
  @PrimaryColumn({ type: 'uuid', primaryKeyConstraintName: 'PK_chats_id' })
  id: string;

  @Column({ name: 'is_group', type: 'boolean' })
  isGroup: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  title: string | null;

  @Column({ name: 'direct_key', type: 'varchar', length: 73, nullable: true })
  directKey: string | null;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'created_by', foreignKeyConstraintName: 'FK_chats_created_by' })
  initiator: Relation<UserEntity>;

  @Column({ name: 'last_message_id', type: 'uuid', nullable: true })
  lastMessageId: string | null;

  @ManyToOne(() => MessageEntity, { nullable: true })
  @JoinColumn({ name: 'last_message_id', foreignKeyConstraintName: 'FK_chats_last_message' })
  lastMessage: Relation<MessageEntity> | null;

  @Column({ name: 'last_message_content', type: 'varchar', length: 100, nullable: true })
  lastMessageContent: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
