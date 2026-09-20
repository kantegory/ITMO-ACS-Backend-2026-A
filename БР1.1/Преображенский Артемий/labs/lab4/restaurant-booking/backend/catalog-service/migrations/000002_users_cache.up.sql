CREATE TABLE IF NOT EXISTS users_cache (
    user_id UUID PRIMARY KEY,
    full_name TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

