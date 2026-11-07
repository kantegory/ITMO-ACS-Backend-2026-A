import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialApplicationSchema1744000000000
    implements MigrationInterface
{
    name = 'InitialApplicationSchema1744000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
        await queryRunner.query(`
            CREATE TYPE "public"."applications_status_enum" AS ENUM('PENDING', 'VIEWED', 'INVITED', 'REJECTED', 'ACCEPTED')
        `);
        await queryRunner.query(`
            CREATE TABLE "applications" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "vacancy_id" uuid NOT NULL,
                "resume_id" uuid NOT NULL,
                "user_id" uuid NOT NULL,
                "cover_letter" text,
                "status" "public"."applications_status_enum" NOT NULL DEFAULT 'PENDING',
                CONSTRAINT "PK_applications_id" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_applications_vacancy_resume" UNIQUE ("vacancy_id", "resume_id")
            )
        `);
        await queryRunner.query(
            `CREATE INDEX "IDX_applications_vacancy_id" ON "applications" ("vacancy_id")`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_applications_resume_id" ON "applications" ("resume_id")`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_applications_user_id" ON "applications" ("user_id")`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "applications"`);
        await queryRunner.query(`DROP TYPE "public"."applications_status_enum"`);
    }
}
