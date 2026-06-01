import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialDictionarySchema1744000000000
    implements MigrationInterface
{
    name = 'InitialDictionarySchema1744000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
        await queryRunner.query(`
            CREATE TABLE "industries" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "title" character varying(255) NOT NULL,
                "is_published" boolean NOT NULL DEFAULT true,
                CONSTRAINT "PK_industries_id" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_industries_title" UNIQUE ("title")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "experience_levels" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "title" character varying(255) NOT NULL,
                "min_experience_months" integer NOT NULL,
                "max_experience_months" integer NOT NULL,
                "is_published" boolean NOT NULL DEFAULT true,
                CONSTRAINT "PK_experience_levels_id" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_experience_levels_title" UNIQUE ("title")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "industries" ("id", "title", "is_published")
            VALUES
                ('11111111-1111-1111-1111-111111111111', 'IT', true),
                ('11111111-1111-1111-1111-111111111112', 'Finance', true),
                ('11111111-1111-1111-1111-111111111113', 'Education', true)
        `);
        await queryRunner.query(`
            INSERT INTO "experience_levels" (
                "id",
                "title",
                "min_experience_months",
                "max_experience_months",
                "is_published"
            )
            VALUES
                ('22222222-2222-2222-2222-222222222222', 'Junior', 0, 24, true),
                ('22222222-2222-2222-2222-222222222223', 'Middle', 24, 60, true),
                ('22222222-2222-2222-2222-222222222224', 'Senior', 60, 240, true)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "experience_levels"`);
        await queryRunner.query(`DROP TABLE "industries"`);
    }
}
