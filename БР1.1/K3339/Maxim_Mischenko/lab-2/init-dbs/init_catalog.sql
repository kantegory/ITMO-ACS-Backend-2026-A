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
    avg_rating DECIMAL(3, 2) DEFAULT 0.0,
    reviews_count INTEGER DEFAULT 0,
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

-- =========================
-- CUISINES
-- =========================

INSERT INTO cuisines (name) VALUES
('Итальянская'),
('Японская'),
('Грузинская'),
('Мексиканская'),
('Французская'),
('Индийская');

-- =========================
-- RESTAURANTS
-- =========================

INSERT INTO restaurants (
    cuisine_id,
    name,
    description,
    city,
    address,
    avg_price_per_person,
    status
) VALUES
(
    1,
    'Pasta Palace',
    'Аутентичная итальянская паста и пицца из дровяной печи',
    'Moscow',
    'Арбат 1',
    2500.00,
    'open'
),
(
    2,
    'Sakura Sushi',
    'Свежие суши и роллы от японских шефов',
    'Saint Petersburg',
    'Невский проспект 24',
    3200.00,
    'open'
),
(
    3,
    'Хачапури House',
    'Традиционная грузинская кухня и домашнее вино',
    'Kazan',
    'Баумана 15',
    1800.00,
    'open'
),
(
    4,
    'El Sombrero',
    'Острая мексиканская кухня и коктейли',
    'Moscow',
    'Тверская 8',
    2700.00,
    'closed'
),
(
    5,
    'Le Gourmet',
    'Французская высокая кухня',
    'Sochi',
    'Морской переулок 3',
    6500.00,
    'open'
),
(
    6,
    'Spicy Curry',
    'Индийские карри и блюда из тандыра',
    'Novosibirsk',
    'Ленина 77',
    2100.00,
    'maintenance'
);

-- =========================
-- MENU ITEMS
-- =========================

INSERT INTO menu_items (
    restaurant_id,
    name,
    price,
    category
) VALUES

-- Pasta Palace
(1, 'Маргарита', 850.00, 'Пицца'),
(1, 'Карбонара', 990.00, 'Паста'),
(1, 'Тирамису', 450.00, 'Десерт'),

-- Sakura Sushi
(2, 'Филадельфия ролл', 1200.00, 'Роллы'),
(2, 'Суши с лососем', 250.00, 'Суши'),
(2, 'Мисо суп', 390.00, 'Суп'),

-- Хачапури House
(3, 'Хачапури по-аджарски', 760.00, 'Выпечка'),
(3, 'Хинкали', 120.00, 'Горячее'),
(3, 'Лобио', 490.00, 'Закуска'),

-- El Sombrero
(4, 'Тако с говядиной', 680.00, 'Горячее'),
(4, 'Буррито', 790.00, 'Горячее'),
(4, 'Начос', 450.00, 'Закуска'),

-- Le Gourmet
(5, 'Фуа-гра', 2400.00, 'Закуска'),
(5, 'Утиная грудка', 3200.00, 'Горячее'),
(5, 'Крем-брюле', 950.00, 'Десерт'),

-- Spicy Curry
(6, 'Чикен карри', 890.00, 'Горячее'),
(6, 'Наан', 190.00, 'Хлеб'),
(6, 'Палак панир', 760.00, 'Вегетарианское');

-- =========================
-- TABLES
-- =========================

INSERT INTO tables (
    restaurant_id,
    capacity,
    label
) VALUES

-- Pasta Palace
(1, 2, 'У окна'),
(1, 4, 'Семейный'),
(1, 6, 'VIP'),

-- Sakura Sushi
(2, 2, 'S1'),
(2, 4, 'S2'),
(2, 8, 'Tatami'),

-- Хачапури House
(3, 4, 'Грузинский зал'),
(3, 10, 'Большой стол'),

-- El Sombrero
(4, 2, 'Бар'),
(4, 6, 'Fiesta'),

-- Le Gourmet
(5, 2, 'Терраса'),
(5, 4, 'Панорамный'),

-- Spicy Curry
(6, 4, 'Curry Hall'),
(6, 8, 'Family Combo');
