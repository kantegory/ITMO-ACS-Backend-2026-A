import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialVacancySchema1744000000000 implements MigrationInterface {
    name = 'InitialVacancySchema1744000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
        await queryRunner.query(`
            CREATE TYPE "public"."vacancies_employment_type_enum" AS ENUM('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."vacancies_work_format_enum" AS ENUM('OFFICE', 'REMOTE', 'HYBRID')
        `);
        await queryRunner.query(`
            CREATE TABLE "vacancies" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "company_id" uuid NOT NULL,
                "employer_profile_id" uuid NOT NULL,
                "industry_id" uuid NOT NULL,
                "experience_level_id" uuid NOT NULL,
                "title" character varying(255) NOT NULL,
                "description" text NOT NULL,
                "requirements" text NOT NULL,
                "responsibilities" text NOT NULL,
                "salary_from" numeric(12,2) NOT NULL,
                "salary_to" numeric(12,2) NOT NULL,
                "city" character varying(255) NOT NULL,
                "employment_type" "public"."vacancies_employment_type_enum" NOT NULL,
                "work_format" "public"."vacancies_work_format_enum" NOT NULL,
                "is_published" boolean NOT NULL DEFAULT false,
                CONSTRAINT "PK_vacancies_id" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(
            `CREATE INDEX "IDX_vacancies_company_id" ON "vacancies" ("company_id")`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_vacancies_employer_profile_id" ON "vacancies" ("employer_profile_id")`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_vacancies_industry_id" ON "vacancies" ("industry_id")`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_vacancies_experience_level_id" ON "vacancies" ("experience_level_id")`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_vacancies_title" ON "vacancies" ("title")`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_vacancies_city" ON "vacancies" ("city")`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_vacancies_is_published" ON "vacancies" ("is_published")`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "vacancies"`);
        await queryRunner.query(
            `DROP TYPE "public"."vacancies_work_format_enum"`,
        );
        await queryRunner.query(
            `DROP TYPE "public"."vacancies_employment_type_enum"`,
        );
    }
}
