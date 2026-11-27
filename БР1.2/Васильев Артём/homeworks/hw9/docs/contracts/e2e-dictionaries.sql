-- Optional additive fixture for an isolated test dictionary-service database.
-- Frozen HW6 seeds remain untouched; DEFAULT gen_random_uuid() produces valid v4 IDs.
BEGIN;
INSERT INTO industries (title, is_published)
VALUES ('HW9 E2E IT', true)
ON CONFLICT (title) DO NOTHING;
INSERT INTO experience_levels (title, min_experience_months, max_experience_months, is_published)
VALUES ('HW9 E2E Middle', 24, 60, true)
ON CONFLICT (title) DO NOTHING;
COMMIT;
