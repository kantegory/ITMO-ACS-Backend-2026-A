CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    username        VARCHAR(50)  NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    phone           VARCHAR(32)  NOT NULL,
    verified        BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT       NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL,
    expires_at  TIMESTAMPTZ  NOT NULL,
    revoked_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens (token_hash);

CREATE TABLE email_verification_tokens (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT       NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL,
    expires_at  TIMESTAMPTZ  NOT NULL,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_verification_user_id ON email_verification_tokens (user_id);

CREATE TABLE listings (
    id          BIGSERIAL PRIMARY KEY,
    owner_id    BIGINT REFERENCES users (id) ON DELETE SET NULL,
    rent_mode   VARCHAR(16)  NOT NULL,
    title       VARCHAR(100) NOT NULL,
    description TEXT,
    address     VARCHAR(500) NOT NULL,
    location    geometry(Point, 4326),
    house_type  VARCHAR(32)  NOT NULL,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_listings_rent_mode CHECK (rent_mode IN ('DAILY', 'MONTHLY'))
);

CREATE INDEX idx_listings_rent_mode ON listings (rent_mode);
CREATE INDEX idx_listings_house_type ON listings (house_type);
CREATE INDEX idx_listings_is_active ON listings (is_active);
CREATE INDEX idx_listings_owner_id ON listings (owner_id);
CREATE INDEX idx_listings_location ON listings USING GIST (location);

CREATE TABLE listing_photos (
    id          BIGSERIAL PRIMARY KEY,
    listing_id  BIGINT       NOT NULL REFERENCES listings (id) ON DELETE CASCADE,
    url         VARCHAR(2048) NOT NULL,
    uploaded_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    is_main     BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_listing_photos_listing_id ON listing_photos (listing_id);

CREATE TABLE listing_daily (
    listing_id       BIGINT PRIMARY KEY REFERENCES listings (id) ON DELETE CASCADE,
    price_per_night  NUMERIC(12, 2) NOT NULL CHECK (price_per_night > 0),
    min_nights       INT            NOT NULL DEFAULT 1,
    max_nights       INT,
    check_in_time    VARCHAR(16),
    check_out_time   VARCHAR(16)
);

CREATE TABLE listing_monthly (
    listing_id         BIGINT PRIMARY KEY REFERENCES listings (id) ON DELETE CASCADE,
    price_per_month      NUMERIC(12, 2) NOT NULL CHECK (price_per_month > 0),
    deposit              NUMERIC(12, 2) NOT NULL DEFAULT 0,
    communal_payments    BOOLEAN        NOT NULL DEFAULT FALSE,
    min_month            INT
);

CREATE TABLE bookings (
    id                      BIGSERIAL PRIMARY KEY,
    listing_id              BIGINT         NOT NULL REFERENCES listings (id),
    guest_id                BIGINT         NOT NULL REFERENCES users (id),
    status                  VARCHAR(16)    NOT NULL,
    start_date              DATE           NOT NULL,
    end_date                DATE           NOT NULL,
    price_per_night_snapshot NUMERIC(12, 2) NOT NULL,
    total_amount            NUMERIC(12, 2) NOT NULL,
    created_at              TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_bookings_dates CHECK (end_date > start_date),
    CONSTRAINT chk_bookings_status CHECK (status IN ('PENDING', 'ACCEPTED', 'CANCELED', 'COMPLETED'))
);

CREATE INDEX idx_bookings_listing_id ON bookings (listing_id);
CREATE INDEX idx_bookings_guest_id ON bookings (guest_id);
CREATE INDEX idx_bookings_status ON bookings (status);
CREATE INDEX idx_bookings_dates ON bookings (listing_id, start_date, end_date);

CREATE TABLE rents (
    id                    BIGSERIAL PRIMARY KEY,
    listing_id            BIGINT       NOT NULL REFERENCES listings (id),
    guest_id              BIGINT       NOT NULL REFERENCES users (id),
    communication_method  VARCHAR(16)  NOT NULL,
    status                VARCHAR(16)  NOT NULL,
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_rents_communication CHECK (communication_method IN ('CHAT', 'CALL')),
    CONSTRAINT chk_rents_status CHECK (status IN ('NEW', 'IN_PROGRESS', 'CLOSED'))
);

CREATE INDEX idx_rents_listing_id ON rents (listing_id);
CREATE INDEX idx_rents_guest_id ON rents (guest_id);

CREATE TABLE chats (
    id          BIGSERIAL PRIMARY KEY,
    user1_id    BIGINT      NOT NULL REFERENCES users (id),
    user2_id    BIGINT      NOT NULL REFERENCES users (id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_chats_users UNIQUE (user1_id, user2_id),
    CONSTRAINT chk_chats_order CHECK (user1_id < user2_id)
);

CREATE INDEX idx_chats_user1 ON chats (user1_id);
CREATE INDEX idx_chats_user2 ON chats (user2_id);

CREATE TABLE messages (
    id          BIGSERIAL PRIMARY KEY,
    chat_id     BIGINT      NOT NULL REFERENCES chats (id) ON DELETE CASCADE,
    sender_id   BIGINT REFERENCES users (id) ON DELETE SET NULL,
    content     TEXT        NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_chat_id ON messages (chat_id);

CREATE TABLE payments (
    id                  BIGSERIAL PRIMARY KEY,
    booking_id          BIGINT         NOT NULL REFERENCES bookings (id) ON DELETE RESTRICT,
    payment_system_id   VARCHAR(255),
    amount              NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    commission          NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (commission >= 0),
    status              VARCHAR(16)    NOT NULL,
    payment_method      VARCHAR(16)    NOT NULL,
    failure_reason      TEXT,
    created_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    paid_at             TIMESTAMPTZ,
    CONSTRAINT chk_payments_status CHECK (status IN ('NEW', 'SUCCESS', 'CANCELED', 'FAILED')),
    CONSTRAINT chk_payments_method CHECK (payment_method IN ('CARD', 'SPB'))
);

CREATE INDEX idx_payments_booking_id ON payments (booking_id);
CREATE INDEX idx_payments_status ON payments (status);
