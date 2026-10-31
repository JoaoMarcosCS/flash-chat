import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTableMessages1791514268738 implements MigrationInterface {
  name = 'CreateTableMessages1791514268738';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "messages" ("id" uuid NOT NULL, "chat_id" uuid NOT NULL, "sender_id" uuid NOT NULL, "content" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "CK_messages_content" CHECK (char_length("content") BETWEEN 1 AND 1000), CONSTRAINT "PK_messages_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_messages_chat" ON "messages" ("chat_id", "id") `);
    await queryRunner.query(
      `ALTER TABLE "chats" ADD CONSTRAINT "FK_chats_last_message" FOREIGN KEY ("last_message_id") REFERENCES "messages"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_messages_participant" FOREIGN KEY ("chat_id", "sender_id") REFERENCES "chat_participants"("chat_id","user_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_messages_participant"`);
    await queryRunner.query(`ALTER TABLE "chats" DROP CONSTRAINT "FK_chats_last_message"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_messages_chat"`);
    await queryRunner.query(`DROP TABLE "messages"`);
  }
}
