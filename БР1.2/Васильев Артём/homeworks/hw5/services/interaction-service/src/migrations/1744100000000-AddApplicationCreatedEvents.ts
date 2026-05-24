import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddApplicationCreatedEvents1744100000000
    implements MigrationInterface
{
    name = 'AddApplicationCreatedEvents1744100000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "application_created_events" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "event_id" uuid NOT NULL,
                "event_type" varchar(100) NOT NULL,
                "occurred_at" TIMESTAMPTZ NOT NULL,
                "application_id" uuid NOT NULL,
                "vacancy_id" uuid NOT NULL,
                "applicant_id" uuid NOT NULL,
                "resume_id" uuid NOT NULL,
                "status" varchar(50) NOT NULL,
                CONSTRAINT "PK_application_created_events_id" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_application_created_events_event_id" UNIQUE ("event_id")
            )
        `);
        await queryRunner.query(
            `CREATE INDEX "IDX_application_created_events_application_id" ON "application_created_events" ("application_id")`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_application_created_events_vacancy_id" ON "application_created_events" ("vacancy_id")`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_application_created_events_applicant_id" ON "application_created_events" ("applicant_id")`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "application_created_events"`);
    }
}
