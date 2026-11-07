import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddContentStatusToMessages1794017468085 implements MigrationInterface {
  name = 'AddContentStatusToMessages1794017468085';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "messages" ADD "content_status" smallint NOT NULL DEFAULT '1'`,
    );
    await queryRunner.query(`ALTER TABLE "messages" ADD "edited_at" TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(`ALTER TABLE "messages" ADD "deleted_at" TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(`ALTER TABLE "messages" ALTER COLUMN "content" DROP NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "CK_messages_deleted_content" CHECK (("content_status" = 3) = ("content" IS NULL))`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "CK_messages_content_status" CHECK ("content_status" IN (1, 2, 3))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "CK_messages_content_status"`);
    await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "CK_messages_deleted_content"`);
    await queryRunner.query(`ALTER TABLE "messages" ALTER COLUMN "content" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "edited_at"`);
    await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "content_status"`);
  }
}
