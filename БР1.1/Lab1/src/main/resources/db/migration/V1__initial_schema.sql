CREATE TABLE user_roles (name varchar(255) PRIMARY KEY);
INSERT INTO user_roles(name) VALUES ('tenant'), ('landlord'), ('admin');
CREATE TABLE users (
 id uuid PRIMARY KEY, email varchar(255) NOT NULL UNIQUE, password_hash varchar(255) NOT NULL,
 full_name varchar(255) NOT NULL, phone varchar(255) NOT NULL, role varchar(255) NOT NULL REFERENCES user_roles(name)
);
CREATE TABLE properties (
 id uuid PRIMARY KEY, landlord_id uuid NOT NULL REFERENCES users(id), title varchar(255) NOT NULL,
 description varchar(10000) NOT NULL, property_type varchar(255) NOT NULL CHECK (property_type IN ('apartment','house','room','commercial')),
 price_per_month numeric(14,2) NOT NULL CHECK (price_per_month > 0), security_deposit numeric(14,2) NOT NULL CHECK (security_deposit >= 0),
 city varchar(255) NOT NULL, address varchar(255) NOT NULL, rooms_count integer CHECK (rooms_count >= 0),
 area_sqm numeric(12,2), is_active boolean NOT NULL
);
CREATE INDEX properties_search_idx ON properties(is_active, city, property_type, price_per_month);
CREATE TABLE rental_conditions (
 id uuid PRIMARY KEY, property_id uuid NOT NULL UNIQUE REFERENCES properties(id), minimum_months integer NOT NULL,
 utilities_included boolean NOT NULL, pets_allowed boolean NOT NULL, notes varchar(2000)
);
CREATE TABLE property_photos (
 id uuid PRIMARY KEY, property_id uuid NOT NULL REFERENCES properties(id), content_type varchar(255) NOT NULL, content bytea NOT NULL
);
CREATE TABLE favorites (
 id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id), property_id uuid NOT NULL REFERENCES properties(id), UNIQUE(user_id, property_id)
);
CREATE TABLE bookings (
 id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES users(id), property_id uuid NOT NULL REFERENCES properties(id),
 start_date date NOT NULL, end_date date NOT NULL, status varchar(255) NOT NULL, message varchar(4000),
 CHECK(end_date >= start_date), CHECK(status IN ('pending','confirmed','cancelled','completed'))
);
CREATE INDEX bookings_dates_idx ON bookings(property_id, status, start_date, end_date);
CREATE TABLE rental_contracts (
 id uuid PRIMARY KEY, booking_id uuid NOT NULL UNIQUE REFERENCES bookings(id), contract_number varchar(255) NOT NULL UNIQUE,
 monthly_rent numeric(14,2) NOT NULL, status varchar(255) NOT NULL CHECK(status IN ('active','completed','cancelled'))
);
CREATE TABLE payments (
 id uuid PRIMARY KEY, contract_id uuid NOT NULL REFERENCES rental_contracts(id), amount numeric(14,2) NOT NULL,
 status varchar(255) NOT NULL CHECK(status IN ('pending','paid','cancelled'))
);
CREATE TABLE messages (
 id uuid PRIMARY KEY, sender_id uuid NOT NULL REFERENCES users(id), receiver_id uuid NOT NULL REFERENCES users(id),
 property_id uuid NOT NULL REFERENCES properties(id), message_text varchar(4000) NOT NULL, sent_at timestamp with time zone NOT NULL, is_read boolean NOT NULL
);
CREATE INDEX messages_dialog_idx ON messages(property_id, sender_id, receiver_id, sent_at);
CREATE TABLE reviews (
 id uuid PRIMARY KEY, contract_id uuid NOT NULL REFERENCES rental_contracts(id), author_id uuid NOT NULL REFERENCES users(id),
 rating integer NOT NULL CHECK(rating BETWEEN 1 AND 5), comment varchar(4000) NOT NULL, UNIQUE(contract_id, author_id)
);
