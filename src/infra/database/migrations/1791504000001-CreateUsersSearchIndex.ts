import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersSearchIndex1791504000001 implements MigrationInterface {
  name = 'CreateUsersSearchIndex1791504000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_users_search" ON "users"
        USING GIN (to_tsvector('simple', coalesce("name", '') || ' ' || coalesce("nickname", '')))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_users_search"`);
  }
}
