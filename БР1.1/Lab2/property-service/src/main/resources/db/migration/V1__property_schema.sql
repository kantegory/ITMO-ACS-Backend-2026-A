CREATE TABLE properties (
    id UUID PRIMARY KEY,
    landlord_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description VARCHAR(10000) NOT NULL,
    property_type VARCHAR(32) NOT NULL CHECK (property_type IN ('apartment', 'house', 'room', 'commercial')),
    price_per_month DECIMAL(14,2) NOT NULL CHECK (price_per_month > 0),
    security_deposit DECIMAL(14,2) NOT NULL CHECK (security_deposit >= 0),
    city VARCHAR(255) NOT NULL,
    address VARCHAR(255) NOT NULL,
    rooms_count INTEGER CHECK (rooms_count >= 0),
    area_sqm DECIMAL(12,2),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE INDEX properties_search_idx ON properties(is_active, city, property_type, price_per_month);

CREATE TABLE rental_conditions (
    id UUID PRIMARY KEY,
    property_id UUID NOT NULL UNIQUE REFERENCES properties(id),
    minimum_months INTEGER NOT NULL,
    utilities_included BOOLEAN NOT NULL,
    pets_allowed BOOLEAN NOT NULL,
    notes VARCHAR(2000)
);

CREATE TABLE property_photos (
    id UUID PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES properties(id),
    content_type VARCHAR(255) NOT NULL,
    content BYTEA NOT NULL
);

CREATE TABLE favorites (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    property_id UUID NOT NULL,
    CONSTRAINT favorites_unique UNIQUE(user_id, property_id)
);
