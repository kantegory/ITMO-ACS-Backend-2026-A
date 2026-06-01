-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role        VARCHAR(20)  NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Таблица ресторанов
CREATE TABLE IF NOT EXISTS restaurants (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name         VARCHAR(255) NOT NULL,
    description  TEXT,
    cuisine_type VARCHAR(100),
    location     VARCHAR(255),
    price_range  SMALLINT     NOT NULL DEFAULT 1 CHECK (price_range BETWEEN 1 AND 3),
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Фотографии ресторанов
CREATE TABLE IF NOT EXISTS restaurant_photos (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID         NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    photo_url     TEXT         NOT NULL
);

-- Столики ресторана
CREATE TABLE IF NOT EXISTS tables (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID         NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    table_number  INT          NOT NULL,
    capacity      INT          NOT NULL CHECK (capacity > 0),
    UNIQUE (restaurant_id, table_number)
);

-- Позиции меню
CREATE TABLE IF NOT EXISTS menu_items (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID           NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name          VARCHAR(255)   NOT NULL,
    description   TEXT,
    price         NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    category      VARCHAR(100)
);

-- Бронирования
CREATE TABLE IF NOT EXISTS bookings (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    table_id    UUID        NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
    booked_date DATE        NOT NULL,
    time_from   TIME        NOT NULL,
    time_to     TIME        NOT NULL,
    guests_count INT        NOT NULL CHECK (guests_count > 0),
    status      VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Отзывы
CREATE TABLE IF NOT EXISTS reviews (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    restaurant_id UUID        NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    rating        SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment       TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, restaurant_id)
);

-- Индексы для ускорения поиска
CREATE INDEX IF NOT EXISTS idx_restaurants_cuisine_type ON restaurants(cuisine_type);
CREATE INDEX IF NOT EXISTS idx_restaurants_location     ON restaurants(location);
CREATE INDEX IF NOT EXISTS idx_restaurants_price_range  ON restaurants(price_range);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id         ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_table_id        ON bookings(table_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date            ON bookings(booked_date);
CREATE INDEX IF NOT EXISTS idx_reviews_restaurant_id    ON reviews(restaurant_id);
