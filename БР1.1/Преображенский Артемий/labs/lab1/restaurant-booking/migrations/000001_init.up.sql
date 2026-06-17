CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
    CREATE TYPE cuisine_type AS ENUM (
        'italian',
        'japanese',
        'georgian',
        'russian',
        'american',
        'mexican',
        'chinese',
        'thai',
        'indian',
        'european',
        'mediterranean',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
    CREATE TYPE price_category AS ENUM (
        'low',
        'medium',
        'high'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END
$$;

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

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT users_phone_len CHECK (phone IS NULL OR length(phone) BETWEEN 6 AND 32)
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_uq ON users (email);
CREATE UNIQUE INDEX IF NOT EXISTS users_phone_uq ON users (phone) WHERE phone IS NOT NULL;

CREATE TABLE IF NOT EXISTS restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT NOT NULL,
    cuisine_type cuisine_type NOT NULL,
    price_category price_category NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    photos TEXT[] NOT NULL DEFAULT ARRAY[]::text[]
);

ALTER TABLE restaurants
    ADD COLUMN IF NOT EXISTS photos TEXT[] NOT NULL DEFAULT ARRAY[]::text[];

CREATE INDEX IF NOT EXISTS restaurants_city_idx ON restaurants (city);
CREATE INDEX IF NOT EXISTS restaurants_cuisine_type_idx ON restaurants (cuisine_type);
CREATE INDEX IF NOT EXISTS restaurants_price_category_idx ON restaurants (price_category);
CREATE INDEX IF NOT EXISTS restaurants_filters_idx ON restaurants (city, cuisine_type, price_category);

CREATE TABLE IF NOT EXISTS restaurant_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants (id) ON DELETE CASCADE,
    table_number INT NOT NULL,
    seats_count INT NOT NULL,
    CONSTRAINT restaurant_tables_table_number_gt0 CHECK (table_number > 0),
    CONSTRAINT restaurant_tables_seats_count_gt0 CHECK (seats_count > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS restaurant_tables_restaurant_table_number_uq
    ON restaurant_tables (restaurant_id, table_number);

CREATE INDEX IF NOT EXISTS restaurant_tables_restaurant_id_idx ON restaurant_tables (restaurant_id);

CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants (id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    category TEXT NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT true,
    pfc_proteins NUMERIC(6, 2) NOT NULL DEFAULT 0,
    pfc_fats NUMERIC(6, 2) NOT NULL DEFAULT 0,
    pfc_carbs NUMERIC(6, 2) NOT NULL DEFAULT 0,
    CONSTRAINT menu_items_price_gt0 CHECK (price > 0),
    CONSTRAINT menu_items_pfc_non_negative CHECK (
        pfc_proteins >= 0 AND pfc_fats >= 0 AND pfc_carbs >= 0
    )
);

CREATE INDEX IF NOT EXISTS menu_items_restaurant_id_idx ON menu_items (restaurant_id);
CREATE INDEX IF NOT EXISTS menu_items_category_idx ON menu_items (category);
CREATE INDEX IF NOT EXISTS menu_items_pfc_idx ON menu_items (pfc_proteins, pfc_fats, pfc_carbs);

CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES restaurants (id) ON DELETE CASCADE,
    rating INT NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT reviews_rating_range CHECK (rating BETWEEN 1 AND 5)
);

CREATE UNIQUE INDEX IF NOT EXISTS reviews_user_restaurant_uq ON reviews (user_id, restaurant_id);
CREATE INDEX IF NOT EXISTS reviews_restaurant_id_idx ON reviews (restaurant_id);

CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES restaurants (id) ON DELETE CASCADE,
    table_id UUID NOT NULL REFERENCES restaurant_tables (id) ON DELETE RESTRICT,
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

DO $$
DECLARE
    rid UUID;
    uid UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM restaurants) THEN
        INSERT INTO restaurants (name, description, city, address, cuisine_type, price_category, photos)
        VALUES ('Demo Restaurant', 'Demo description', 'Saint Petersburg', 'Demo address', 'italian', 'medium', ARRAY[]::text[])
        RETURNING id INTO rid;

        INSERT INTO restaurant_tables (restaurant_id, table_number, seats_count)
        VALUES (rid, 1, 2), (rid, 2, 4), (rid, 3, 6);

        INSERT INTO menu_items (restaurant_id, name, description, price, category, is_available, pfc_proteins, pfc_fats, pfc_carbs)
        VALUES
            (rid, 'Margherita', 'Classic pizza', 690.00, 'pizza', true, 12.0, 10.0, 62.0),
            (rid, 'Tiramisu', 'Classic dessert', 390.00, 'dessert', true, 6.0, 14.0, 42.0);

        IF NOT EXISTS (SELECT 1 FROM users) THEN
            INSERT INTO users (email, password_hash, full_name, phone)
            VALUES ('demo@example.com', 'demo', 'Demo User', '+70000000000')
            RETURNING id INTO uid;
        ELSE
            SELECT id INTO uid FROM users ORDER BY created_at ASC LIMIT 1;
        END IF;

        INSERT INTO reviews (user_id, restaurant_id, rating, text)
        VALUES (uid, rid, 5, 'Demo review');
    END IF;
END
$$;
