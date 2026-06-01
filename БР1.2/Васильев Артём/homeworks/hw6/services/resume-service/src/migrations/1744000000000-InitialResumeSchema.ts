import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialResumeSchema1744000000000 implements MigrationInterface {
    name = 'InitialResumeSchema1744000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
        await queryRunner.query(`
            CREATE TYPE "public"."resumes_employment_type_enum" AS ENUM('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."resumes_work_format_enum" AS ENUM('OFFICE', 'REMOTE', 'HYBRID')
        `);
        await queryRunner.query(`
            CREATE TABLE "resumes" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "user_id" uuid NOT NULL,
                "title" character varying(255) NOT NULL,
                "desired_position" character varying(255) NOT NULL,
                "about_me" text NOT NULL,
                "skills" text NOT NULL,
                "education" text NOT NULL,
                "salary_expectation" numeric(12,2) NOT NULL,
                "city" character varying(255) NOT NULL,
                "employment_type" "public"."resumes_employment_type_enum" NOT NULL,
                "work_format" "public"."resumes_work_format_enum" NOT NULL,
                "is_published" boolean NOT NULL DEFAULT false,
                CONSTRAINT "PK_resumes_id" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "resume_experiences" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "resume_id" uuid NOT NULL,
                "company_name" character varying(255) NOT NULL,
                "position" character varying(255) NOT NULL,
                "description" text NOT NULL,
                "start_date" date NOT NULL,
                "end_date" date,
                "months_count" integer NOT NULL,
                CONSTRAINT "PK_resume_experiences_id" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(
            `CREATE INDEX "IDX_resumes_user_id" ON "resumes" ("user_id")`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_resumes_title" ON "resumes" ("title")`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_resumes_desired_position" ON "resumes" ("desired_position")`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_resumes_city" ON "resumes" ("city")`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_resume_experiences_resume_id" ON "resume_experiences" ("resume_id")`,
        );
        await queryRunner.query(`
            ALTER TABLE "resume_experiences"
            ADD CONSTRAINT "FK_resume_experiences_resume_id"
            FOREIGN KEY ("resume_id") REFERENCES "resumes"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "resume_experiences" DROP CONSTRAINT "FK_resume_experiences_resume_id"`,
        );
        await queryRunner.query(`DROP TABLE "resume_experiences"`);
        await queryRunner.query(`DROP TABLE "resumes"`);
        await queryRunner.query(`DROP TYPE "public"."resumes_work_format_enum"`);
        await queryRunner.query(
            `DROP TYPE "public"."resumes_employment_type_enum"`,
        );
    }
}
