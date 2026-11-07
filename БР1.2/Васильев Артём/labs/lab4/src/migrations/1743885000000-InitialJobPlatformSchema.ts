import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialJobPlatformSchema1743885000000 implements MigrationInterface {
    name = 'InitialJobPlatformSchema1743885000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE EXTENSION IF NOT EXISTS "pgcrypto";
        `);

        await queryRunner.query(`
            CREATE TYPE "public"."users_role_enum" AS ENUM('ADMIN', 'APPLICANT', 'EMPLOYER');
            CREATE TYPE "public"."resumes_employment_type_enum" AS ENUM('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP');
            CREATE TYPE "public"."resumes_work_format_enum" AS ENUM('OFFICE', 'REMOTE', 'HYBRID');
            CREATE TYPE "public"."vacancies_employment_type_enum" AS ENUM('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP');
            CREATE TYPE "public"."vacancies_work_format_enum" AS ENUM('OFFICE', 'REMOTE', 'HYBRID');
            CREATE TYPE "public"."applications_status_enum" AS ENUM('PENDING', 'VIEWED', 'INVITED', 'REJECTED', 'ACCEPTED');
        `);

        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "role" "public"."users_role_enum" NOT NULL,
                "first_name" character varying(255) NOT NULL,
                "last_name" character varying(255) NOT NULL,
                "middle_name" character varying(255),
                "email" character varying(255) NOT NULL,
                "password" character varying(255) NOT NULL,
                "phone" character varying(50) NOT NULL,
                "is_verified" boolean NOT NULL DEFAULT false,
                CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_users_email" UNIQUE ("email")
            );

            CREATE TABLE "companies" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "title" character varying(255) NOT NULL,
                "description" text,
                "website" character varying(255),
                "industry_text" character varying(255),
                "address" character varying(255),
                "employee_count" integer,
                CONSTRAINT "PK_companies_id" PRIMARY KEY ("id")
            );

            CREATE TABLE "industries" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "title" character varying(255) NOT NULL,
                "is_published" boolean NOT NULL DEFAULT true,
                CONSTRAINT "PK_industries_id" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_industries_title" UNIQUE ("title")
            );

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
            );

            CREATE TABLE "employer_profiles" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "user_id" uuid NOT NULL,
                "company_id" uuid NOT NULL,
                "position" character varying(255) NOT NULL,
                CONSTRAINT "PK_employer_profiles_id" PRIMARY KEY ("id")
            );

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
            );

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
            );

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
            );

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
            );

            CREATE TABLE "favorite_vacancies" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "user_id" uuid NOT NULL,
                "vacancy_id" uuid NOT NULL,
                CONSTRAINT "PK_favorite_vacancies_id" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_favorite_vacancies_user_vacancy" UNIQUE ("user_id", "vacancy_id")
            );

            CREATE TABLE "vacancy_views" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "user_id" uuid NOT NULL,
                "vacancy_id" uuid NOT NULL,
                CONSTRAINT "PK_vacancy_views_id" PRIMARY KEY ("id")
            );
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_companies_title" ON "companies" ("title");
            CREATE INDEX "IDX_employer_profiles_user_id" ON "employer_profiles" ("user_id");
            CREATE UNIQUE INDEX "IDX_employer_profiles_user_company" ON "employer_profiles" ("user_id", "company_id");
            CREATE INDEX "IDX_employer_profiles_company_id" ON "employer_profiles" ("company_id");
            CREATE INDEX "IDX_resumes_user_id" ON "resumes" ("user_id");
            CREATE INDEX "IDX_resumes_title" ON "resumes" ("title");
            CREATE INDEX "IDX_resumes_desired_position" ON "resumes" ("desired_position");
            CREATE INDEX "IDX_resumes_city" ON "resumes" ("city");
            CREATE INDEX "IDX_resume_experiences_resume_id" ON "resume_experiences" ("resume_id");
            CREATE INDEX "IDX_vacancies_company_id" ON "vacancies" ("company_id");
            CREATE INDEX "IDX_vacancies_employer_profile_id" ON "vacancies" ("employer_profile_id");
            CREATE INDEX "IDX_vacancies_industry_id" ON "vacancies" ("industry_id");
            CREATE INDEX "IDX_vacancies_experience_level_id" ON "vacancies" ("experience_level_id");
            CREATE INDEX "IDX_vacancies_title" ON "vacancies" ("title");
            CREATE INDEX "IDX_vacancies_city" ON "vacancies" ("city");
            CREATE INDEX "IDX_vacancies_is_published" ON "vacancies" ("is_published");
            CREATE INDEX "IDX_applications_vacancy_id" ON "applications" ("vacancy_id");
            CREATE INDEX "IDX_applications_resume_id" ON "applications" ("resume_id");
            CREATE INDEX "IDX_applications_user_id" ON "applications" ("user_id");
            CREATE INDEX "IDX_favorite_vacancies_user_id" ON "favorite_vacancies" ("user_id");
            CREATE INDEX "IDX_favorite_vacancies_vacancy_id" ON "favorite_vacancies" ("vacancy_id");
            CREATE INDEX "IDX_vacancy_views_user_id" ON "vacancy_views" ("user_id");
            CREATE INDEX "IDX_vacancy_views_vacancy_id" ON "vacancy_views" ("vacancy_id");
        `);

        await queryRunner.query(`
            ALTER TABLE "employer_profiles"
            ADD CONSTRAINT "FK_employer_profiles_user_id"
            FOREIGN KEY ("user_id") REFERENCES "users"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION;

            ALTER TABLE "employer_profiles"
            ADD CONSTRAINT "FK_employer_profiles_company_id"
            FOREIGN KEY ("company_id") REFERENCES "companies"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION;

            ALTER TABLE "resumes"
            ADD CONSTRAINT "FK_resumes_user_id"
            FOREIGN KEY ("user_id") REFERENCES "users"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION;

            ALTER TABLE "resume_experiences"
            ADD CONSTRAINT "FK_resume_experiences_resume_id"
            FOREIGN KEY ("resume_id") REFERENCES "resumes"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION;

            ALTER TABLE "vacancies"
            ADD CONSTRAINT "FK_vacancies_company_id"
            FOREIGN KEY ("company_id") REFERENCES "companies"("id")
            ON DELETE RESTRICT ON UPDATE NO ACTION;

            ALTER TABLE "vacancies"
            ADD CONSTRAINT "FK_vacancies_employer_profile_id"
            FOREIGN KEY ("employer_profile_id") REFERENCES "employer_profiles"("id")
            ON DELETE RESTRICT ON UPDATE NO ACTION;

            ALTER TABLE "vacancies"
            ADD CONSTRAINT "FK_vacancies_industry_id"
            FOREIGN KEY ("industry_id") REFERENCES "industries"("id")
            ON DELETE RESTRICT ON UPDATE NO ACTION;

            ALTER TABLE "vacancies"
            ADD CONSTRAINT "FK_vacancies_experience_level_id"
            FOREIGN KEY ("experience_level_id") REFERENCES "experience_levels"("id")
            ON DELETE RESTRICT ON UPDATE NO ACTION;

            ALTER TABLE "applications"
            ADD CONSTRAINT "FK_applications_vacancy_id"
            FOREIGN KEY ("vacancy_id") REFERENCES "vacancies"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION;

            ALTER TABLE "applications"
            ADD CONSTRAINT "FK_applications_resume_id"
            FOREIGN KEY ("resume_id") REFERENCES "resumes"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION;

            ALTER TABLE "applications"
            ADD CONSTRAINT "FK_applications_user_id"
            FOREIGN KEY ("user_id") REFERENCES "users"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION;

            ALTER TABLE "favorite_vacancies"
            ADD CONSTRAINT "FK_favorite_vacancies_user_id"
            FOREIGN KEY ("user_id") REFERENCES "users"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION;

            ALTER TABLE "favorite_vacancies"
            ADD CONSTRAINT "FK_favorite_vacancies_vacancy_id"
            FOREIGN KEY ("vacancy_id") REFERENCES "vacancies"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION;

            ALTER TABLE "vacancy_views"
            ADD CONSTRAINT "FK_vacancy_views_user_id"
            FOREIGN KEY ("user_id") REFERENCES "users"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION;

            ALTER TABLE "vacancy_views"
            ADD CONSTRAINT "FK_vacancy_views_vacancy_id"
            FOREIGN KEY ("vacancy_id") REFERENCES "vacancies"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "vacancy_views" DROP CONSTRAINT "FK_vacancy_views_vacancy_id";
            ALTER TABLE "vacancy_views" DROP CONSTRAINT "FK_vacancy_views_user_id";
            ALTER TABLE "favorite_vacancies" DROP CONSTRAINT "FK_favorite_vacancies_vacancy_id";
            ALTER TABLE "favorite_vacancies" DROP CONSTRAINT "FK_favorite_vacancies_user_id";
            ALTER TABLE "applications" DROP CONSTRAINT "FK_applications_user_id";
            ALTER TABLE "applications" DROP CONSTRAINT "FK_applications_resume_id";
            ALTER TABLE "applications" DROP CONSTRAINT "FK_applications_vacancy_id";
            ALTER TABLE "vacancies" DROP CONSTRAINT "FK_vacancies_experience_level_id";
            ALTER TABLE "vacancies" DROP CONSTRAINT "FK_vacancies_industry_id";
            ALTER TABLE "vacancies" DROP CONSTRAINT "FK_vacancies_employer_profile_id";
            ALTER TABLE "vacancies" DROP CONSTRAINT "FK_vacancies_company_id";
            ALTER TABLE "resume_experiences" DROP CONSTRAINT "FK_resume_experiences_resume_id";
            ALTER TABLE "resumes" DROP CONSTRAINT "FK_resumes_user_id";
            ALTER TABLE "employer_profiles" DROP CONSTRAINT "FK_employer_profiles_company_id";
            ALTER TABLE "employer_profiles" DROP CONSTRAINT "FK_employer_profiles_user_id";

            DROP TABLE "vacancy_views";
            DROP TABLE "favorite_vacancies";
            DROP TABLE "applications";
            DROP TABLE "vacancies";
            DROP TABLE "resume_experiences";
            DROP TABLE "resumes";
            DROP TABLE "employer_profiles";
            DROP TABLE "experience_levels";
            DROP TABLE "industries";
            DROP TABLE "companies";
            DROP TABLE "users";

            DROP TYPE "public"."applications_status_enum";
            DROP TYPE "public"."vacancies_work_format_enum";
            DROP TYPE "public"."vacancies_employment_type_enum";
            DROP TYPE "public"."resumes_work_format_enum";
            DROP TYPE "public"."resumes_employment_type_enum";
            DROP TYPE "public"."users_role_enum";
        `);
    }
}
