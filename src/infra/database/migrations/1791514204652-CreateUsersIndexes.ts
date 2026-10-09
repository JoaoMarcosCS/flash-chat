import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersIndexes1791514204652 implements MigrationInterface {
  name = 'CreateUsersIndexes1791514204652';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_users_nickname" ON "users" (lower("nickname"))`,
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_users_email" ON "users" (lower("email"))`);
    await queryRunner.query(
      `CREATE INDEX "IDX_users_search" ON "users"
        USING GIN (to_tsvector('simple', coalesce("name", '') || ' ' || coalesce("nickname", '')))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_users_search"`);
    await queryRunner.query(`DROP INDEX "UQ_users_email"`);
    await queryRunner.query(`DROP INDEX "UQ_users_nickname"`);
  }
}
