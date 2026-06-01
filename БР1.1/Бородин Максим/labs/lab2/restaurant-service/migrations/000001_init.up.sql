CREATE TABLE IF NOT EXISTS restaurants (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name         VARCHAR(255) NOT NULL,
    description  TEXT,
    cuisine_type VARCHAR(100),
    location     VARCHAR(255),
    price_range  SMALLINT     NOT NULL DEFAULT 1 CHECK (price_range BETWEEN 1 AND 3),
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS restaurant_photos (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID         NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    photo_url     TEXT         NOT NULL
);

CREATE TABLE IF NOT EXISTS tables (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID         NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    table_number  INT          NOT NULL,
    capacity      INT          NOT NULL CHECK (capacity > 0),
    UNIQUE (restaurant_id, table_number)
);

CREATE TABLE IF NOT EXISTS menu_items (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID           NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name          VARCHAR(255)   NOT NULL,
    description   TEXT,
    price         NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    category      VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS reviews (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID        NOT NULL,
    restaurant_id UUID        NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    rating        SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment       TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, restaurant_id)
);

CREATE INDEX IF NOT EXISTS idx_restaurants_cuisine_type ON restaurants(cuisine_type);
CREATE INDEX IF NOT EXISTS idx_restaurants_location     ON restaurants(location);
CREATE INDEX IF NOT EXISTS idx_restaurants_price_range  ON restaurants(price_range);
CREATE INDEX IF NOT EXISTS idx_reviews_restaurant_id    ON reviews(restaurant_id);
