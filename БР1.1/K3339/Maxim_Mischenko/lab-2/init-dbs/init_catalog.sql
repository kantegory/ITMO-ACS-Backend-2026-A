CREATE TABLE cuisines (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE restaurants (
    id SERIAL PRIMARY KEY,
    cuisine_id INTEGER REFERENCES cuisines(id),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    city VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    avg_price_per_person DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE menu_items (
    id SERIAL PRIMARY KEY,
    restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(50)
);

CREATE TABLE tables (
    id SERIAL PRIMARY KEY,
    restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE,
    capacity INTEGER NOT NULL,
    label VARCHAR(100)
);

INSERT INTO cuisines (name) VALUES ('Итальянская'), ('Японская');
INSERT INTO restaurants (cuisine_id, name, city, address) VALUES (1, 'Pasta Palace', 'Moscow', 'Arbat 1');
INSERT INTO tables (restaurant_id, capacity, label) VALUES (1, 4, 'У окна');
