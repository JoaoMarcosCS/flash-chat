import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTableMessages1791504000005 implements MigrationInterface {
  name = 'CreateTableMessages1791504000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "messages" (
        "id" uuid NOT NULL,
        "chat_id" uuid NOT NULL,
        "sender_id" uuid NOT NULL,
        "content" text NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        CONSTRAINT "PK_messages_id" PRIMARY KEY ("id"),
        CONSTRAINT "CK_messages_content" CHECK (char_length("content") BETWEEN 1 AND 1000),
        CONSTRAINT "FK_messages_participant" FOREIGN KEY ("chat_id", "sender_id")
          REFERENCES "chat_participants" ("chat_id", "user_id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_messages_chat" ON "messages" ("chat_id", "id" DESC)`,
    );
    await queryRunner.query(
      `ALTER TABLE "chats" ADD CONSTRAINT "FK_chats_last_message"
        FOREIGN KEY ("last_message_id") REFERENCES "messages" ("id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "chats" DROP CONSTRAINT "FK_chats_last_message"`);
    await queryRunner.query(`DROP INDEX "IDX_messages_chat"`);
    await queryRunner.query(`DROP TABLE "messages"`);
  }
}
