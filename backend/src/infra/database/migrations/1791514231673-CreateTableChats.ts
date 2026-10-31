import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTableChats1791514231673 implements MigrationInterface {
  name = 'CreateTableChats1791514231673';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "chats" ("id" uuid NOT NULL, "is_group" boolean NOT NULL, "title" character varying(100), "direct_key" character varying(73), "created_by" uuid NOT NULL, "last_message_id" uuid, "last_message_content" character varying(100), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_chats_direct_key" UNIQUE ("direct_key"), CONSTRAINT "CK_chats_direct_key_order" CHECK ("direct_key" IS NULL OR split_part("direct_key", ':', 1) < split_part("direct_key", ':', 2)), CONSTRAINT "CK_chats_direct_key" CHECK ("is_group" = ("direct_key" IS NULL)), CONSTRAINT "CK_chats_title" CHECK ("is_group" = ("title" IS NOT NULL)), CONSTRAINT "PK_chats_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "chats" ADD CONSTRAINT "FK_chats_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "chats" DROP CONSTRAINT "FK_chats_created_by"`);
    await queryRunner.query(`DROP TABLE "chats"`);
  }
}
