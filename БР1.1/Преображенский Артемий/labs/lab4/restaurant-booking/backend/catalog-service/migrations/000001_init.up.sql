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
    user_id UUID NOT NULL,
    restaurant_id UUID NOT NULL REFERENCES restaurants (id) ON DELETE CASCADE,
    rating INT NOT NULL,
    text TEXT NOT NULL,
    author_name TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT reviews_rating_range CHECK (rating BETWEEN 1 AND 5)
);

CREATE UNIQUE INDEX IF NOT EXISTS reviews_user_restaurant_uq ON reviews (user_id, restaurant_id);
CREATE INDEX IF NOT EXISTS reviews_restaurant_id_idx ON reviews (restaurant_id);
