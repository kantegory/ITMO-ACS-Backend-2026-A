CREATE TABLE IF NOT EXISTS bookings (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        NOT NULL,
    table_id     UUID        NOT NULL,
    booked_date  DATE        NOT NULL,
    time_from    TIME        NOT NULL,
    time_to      TIME        NOT NULL,
    guests_count INT         NOT NULL CHECK (guests_count > 0),
    status       VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_user_id   ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_table_id  ON bookings(table_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date      ON bookings(booked_date);
