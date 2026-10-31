import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTableChatParticipants1791514252080 implements MigrationInterface {
  name = 'CreateTableChatParticipants1791514252080';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "chat_participants" ("chat_id" uuid NOT NULL, "user_id" uuid NOT NULL, CONSTRAINT "PK_chat_participants" PRIMARY KEY ("chat_id", "user_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_chat_participants_user" ON "chat_participants" ("user_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_participants" ADD CONSTRAINT "FK_chat_participants_chat" FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_participants" ADD CONSTRAINT "FK_chat_participants_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "chat_participants" DROP CONSTRAINT "FK_chat_participants_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_participants" DROP CONSTRAINT "FK_chat_participants_chat"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_chat_participants_user"`);
    await queryRunner.query(`DROP TABLE "chat_participants"`);
  }
}
