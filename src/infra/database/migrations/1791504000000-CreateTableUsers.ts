import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTableUsers1791504000000 implements MigrationInterface {
  name = 'CreateTableUsers1791504000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users" (
        "id" uuid NOT NULL,
        "name" character varying(255) NOT NULL,
        "nickname" character varying(50) NOT NULL,
        "email" character varying(255) NOT NULL,
        "password" character varying(255) NOT NULL,
        "status" smallint NOT NULL DEFAULT 1,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "CK_users_status" CHECK ("status" IN (1, 2))
      )`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_users_nickname" ON "users" (lower("nickname"))`,
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_users_email" ON "users" (lower("email"))`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "UQ_users_email"`);
    await queryRunner.query(`DROP INDEX "UQ_users_nickname"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
