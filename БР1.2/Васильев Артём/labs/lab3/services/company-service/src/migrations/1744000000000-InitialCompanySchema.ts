import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialCompanySchema1744000000000 implements MigrationInterface {
    name = 'InitialCompanySchema1744000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
        await queryRunner.query(`
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
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "employer_profiles" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "user_id" uuid NOT NULL,
                "company_id" uuid NOT NULL,
                "position" character varying(255) NOT NULL,
                CONSTRAINT "PK_employer_profiles_id" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(
            `CREATE INDEX "IDX_companies_title" ON "companies" ("title")`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_employer_profiles_user_id" ON "employer_profiles" ("user_id")`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_employer_profiles_company_id" ON "employer_profiles" ("company_id")`,
        );
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_employer_profiles_user_company"
            ON "employer_profiles" ("user_id", "company_id")
        `);
        await queryRunner.query(`
            ALTER TABLE "employer_profiles"
            ADD CONSTRAINT "FK_employer_profiles_company_id"
            FOREIGN KEY ("company_id") REFERENCES "companies"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "employer_profiles" DROP CONSTRAINT "FK_employer_profiles_company_id"`,
        );
        await queryRunner.query(`DROP TABLE "employer_profiles"`);
        await queryRunner.query(`DROP TABLE "companies"`);
    }
}
