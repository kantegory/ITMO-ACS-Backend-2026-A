CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
    CREATE TYPE booking_status AS ENUM (
        'pending',
        'confirmed',
        'cancelled',
        'completed'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END
$$;

CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    restaurant_id UUID NOT NULL,
    table_id UUID NOT NULL,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    guests_count INT NOT NULL,
    status booking_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT bookings_time_range CHECK (end_time > start_time),
    CONSTRAINT bookings_guests_count_gt0 CHECK (guests_count > 0)
);

CREATE INDEX IF NOT EXISTS bookings_user_id_idx ON bookings (user_id, booking_date);
CREATE INDEX IF NOT EXISTS bookings_restaurant_id_idx ON bookings (restaurant_id, booking_date);
CREATE INDEX IF NOT EXISTS bookings_table_id_idx ON bookings (table_id, booking_date);
