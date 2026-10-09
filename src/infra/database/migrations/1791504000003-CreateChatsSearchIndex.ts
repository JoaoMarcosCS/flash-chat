import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateChatsSearchIndex1791504000003 implements MigrationInterface {
  name = 'CreateChatsSearchIndex1791504000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_chats_search" ON "chats"
        USING GIN (to_tsvector('simple', coalesce("title", '')))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_chats_search"`);
  }
}
