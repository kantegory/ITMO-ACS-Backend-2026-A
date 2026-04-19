-- 1. Справочник типов недвижимости
CREATE TABLE property_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE -- (Квартира, Дом, Офис, Студия)
);

-- 2. Справочник удобств (amenities)
CREATE TABLE amenities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    icon VARCHAR(50),
    description TEXT
);

-- 3. Таблица пользователей
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) CHECK (role IN ('tenant', 'owner', 'admin')) DEFAULT 'tenant',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Таблица объектов недвижимости
CREATE TABLE properties (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type_id INTEGER REFERENCES property_types(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price_per_day DECIMAL(12, 2) NOT NULL CHECK (price_per_day > 0),
    city VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(9, 6),
    longitude DECIMAL(9, 6),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Фотографии объектов
CREATE TABLE property_images (
    id SERIAL PRIMARY KEY,
    property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_main BOOLEAN DEFAULT FALSE
);

CREATE TABLE property_amenities (
    property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
    amenity_id INTEGER REFERENCES amenities(id) ON DELETE CASCADE,
    PRIMARY KEY (property_id, amenity_id)
);

-- 5. Сделки / Аренда
CREATE TABLE rentals (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES users(id),
    property_id INTEGER REFERENCES properties(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_price DECIMAL(12, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'confirmed', 'paid', 'cancelled', 'finished')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT date_check CHECK (end_date > start_date)
);

-- 6. Сообщения (Чат)
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER REFERENCES users(id),
    receiver_id INTEGER REFERENCES users(id),
    property_id INTEGER REFERENCES properties(id),
    message_text TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Транзакции (Платежи)
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    rental_id INTEGER REFERENCES rentals(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    payment_method VARCHAR(50),
    idempotency_key VARCHAR(64) UNIQUE,
    type VARCHAR(20) DEFAULT 'payment' CHECK (type IN ('payment', 'refund')),
    status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'failed', 'pending', 'refunded')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);