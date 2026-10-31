import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMessagesSearchIndex1791514268739 implements MigrationInterface {
  name = 'CreateMessagesSearchIndex1791514268739';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_messages_search" ON "messages"
        USING GIN (to_tsvector('portuguese', "content"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_messages_search"`);
  }
}
