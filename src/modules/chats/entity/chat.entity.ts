import { Entity, PrimaryColumn, Column, CreateDateColumn, Index, Unique, Check } from 'typeorm';

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
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'is_group', type: 'boolean' })
  isGroup: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  title: string | null;

  @Column({ name: 'direct_key', type: 'varchar', length: 73, nullable: true })
  directKey: string | null;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @Column({ name: 'last_message_id', type: 'uuid', nullable: true })
  lastMessageId: string | null;

  @Column({ name: 'last_message_content', type: 'varchar', length: 100, nullable: true })
  lastMessageContent: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
