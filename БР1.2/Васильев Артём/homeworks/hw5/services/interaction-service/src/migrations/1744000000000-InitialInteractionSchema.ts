import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialInteractionSchema1744000000000
    implements MigrationInterface
{
    name = 'InitialInteractionSchema1744000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
        await queryRunner.query(`
            CREATE TABLE "favorite_vacancies" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "user_id" uuid NOT NULL,
                "vacancy_id" uuid NOT NULL,
                CONSTRAINT "PK_favorite_vacancies_id" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_favorite_vacancies_user_vacancy" UNIQUE ("user_id", "vacancy_id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "vacancy_views" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "user_id" uuid NOT NULL,
                "vacancy_id" uuid NOT NULL,
                CONSTRAINT "PK_vacancy_views_id" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(
            `CREATE INDEX "IDX_favorite_vacancies_user_id" ON "favorite_vacancies" ("user_id")`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_favorite_vacancies_vacancy_id" ON "favorite_vacancies" ("vacancy_id")`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_vacancy_views_user_id" ON "vacancy_views" ("user_id")`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_vacancy_views_vacancy_id" ON "vacancy_views" ("vacancy_id")`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "vacancy_views"`);
        await queryRunner.query(`DROP TABLE "favorite_vacancies"`);
    }
}
