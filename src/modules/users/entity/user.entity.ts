import { UserStatus } from '@/shared/enums/users/user-status.enum';
import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Check,
} from 'typeorm';

@Entity('users')
@Check('CK_users_status', `"status" IN (1, 2)`)
@Index('UQ_users_nickname', { synchronize: false })
@Index('UQ_users_email', { synchronize: false })
@Index('IDX_users_search', { synchronize: false })
export class UserEntity {
  @PrimaryColumn({ type: 'uuid', primaryKeyConstraintName: 'PK_users_id' })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 50 })
  nickname: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'smallint', default: UserStatus.ACTIVE })
  status: UserStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
