-- Property DB (GORM AutoMigrate is source at runtime; SQL for documentation / goose)
CREATE TABLE IF NOT EXISTS properties (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    property_type VARCHAR(20) NOT NULL,
    city TEXT,
    address TEXT,
    description TEXT,
    price_per_month INTEGER NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
