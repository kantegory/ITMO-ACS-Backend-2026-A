-- Comprehensive Test Data for Restaurant Booking System
-- Generated for PostgreSQL
-- Insert in the following order due to foreign key constraints:
-- 1. cuisines
-- 2. users
-- 3. restaurants
-- 4. tables
-- 5. menu_items
-- 6. restaurant_images
-- 7. reviews
-- 8. bookings

-- Clear existing data (optional - use with caution)
TRUNCATE TABLE bookings, reviews, restaurant_images, menu_items, tables, restaurants, users, cuisines CASCADE;

-- ============================================
-- 1. CUISINES
-- ============================================
INSERT INTO cuisines (id, name, created_at) VALUES
(1, 'Italian', NOW()),
(2, 'Japanese', NOW()),
(3, 'Mexican', NOW()),
(4, 'American', NOW()),
(5, 'Chinese', NOW()),
(6, 'French', NOW()),
(7, 'Indian', NOW()),
(8, 'Mediterranean', NOW()),
(9, 'Thai', NOW()),
(10, 'Russian', NOW());

-- ============================================
-- 2. USERS
-- ============================================
-- Passwords are hashed with bcrypt: 'password123' -> '$2b$10$...'
INSERT INTO users (id, email, full_name, phone, password, role, created_at, updated_at) VALUES
(1, 'admin@example.com', 'Admin User', '+79161234567', '$2b$10$N9qo8uLOickgx2ZMRZoMye3Z4L3B.3B7I5KJw8qJ8qJ8qJ8qJ8qJ8q', 'admin', NOW(), NOW()),
(2, 'user1@example.com', 'Иван Иванов', '+79162345678', '$2b$10$N9qo8uLOickgx2ZMRZoMye3Z4L3B.3B7I5KJw8qJ8qJ8qJ8qJ8qJ8q', 'guest', NOW(), NOW()),
(3, 'user2@example.com', 'Мария Петрова', '+79163456789', '$2b$10$N9qo8uLOickgx2ZMRZoMye3Z4L3B.3B7I5KJw8qJ8qJ8qJ8qJ8qJ8q', 'guest', NOW(), NOW()),
(4, 'user3@example.com', 'Алексей Смирнов', '+79164567890', '$2b$10$N9qo8uLOickgx2ZMRZoMye3Z4L3B.3B7I5KJw8qJ8qJ8qJ8qJ8qJ8q', 'guest', NOW(), NOW()),
(5, 'user4@example.com', 'Екатерина Волкова', '+79165678901', '$2b$10$N9qo8uLOickgx2ZMRZoMye3Z4L3B.3B7I5KJw8qJ8qJ8qJ8qJ8qJ8q', 'guest', NOW(), NOW()),
(6, 'user5@example.com', 'Дмитрий Козлов', '+79166789012', '$2b$10$N9qo8uLOickgx2ZMRZoMye3Z4L3B.3B7I5KJw8qJ8qJ8qJ8qJ8qJ8q', 'guest', NOW(), NOW()),
(7, 'user6@example.com', 'Ольга Новикова', '+79167890123', '$2b$10$N9qo8uLOickgx2ZMRZoMye3Z4L3B.3B7I5KJw8qJ8qJ8qJ8qJ8qJ8q', 'guest', NOW(), NOW()),
(8, 'user7@example.com', 'Сергей Морозов', '+79168901234', '$2b$10$N9qo8uLOickgx2ZMRZoMye3Z4L3B.3B7I5KJw8qJ8qJ8qJ8qJ8qJ8q', 'guest', NOW(), NOW()),
(9, 'user8@example.com', 'Анна Павлова', '+79169012345', '$2b$10$N9qo8uLOickgx2ZMRZoMye3Z4L3B.3B7I5KJw8qJ8qJ8qJ8qJ8qJ8q', 'guest', NOW(), NOW()),
(10, 'user9@example.com', 'Павел Лебедев', '+79160123456', '$2b$10$N9qo8uLOickgx2ZMRZoMye3Z4L3B.3B7I5KJw8qJ8qJ8qJ8qJ8qJ8q', 'guest', NOW(), NOW());

-- ============================================
-- 3. RESTAURANTS
-- ============================================
-- Note: rating column doesn't exist in the database (it's computed from reviews)
-- avg_price_per_person, latitude, longitude are optional
-- statuses: open, closed, under_renovation, temporarily_closed, coming_soon
-- working_hours: JSONB array of WorkingHours objects (day_of_week: 0-6, open_time, close_time, is_closed)
INSERT INTO restaurants (id, name, description, cuisine_id, city, address, avg_price_per_person, latitude, longitude, status, "workingHours", created_at, updated_at) VALUES
(1, 'La Bella Italia', 'Аутентичная итальянская кухня с домашней пастой и пиццей из дровяной печи', 1, 'Москва', 'ул. Тверская, д. 15', 1500.00, 55.755826, 37.617300, 'open',
 '[{"day_of_week": 0, "open_time": "11:00", "close_time": "22:00", "is_closed": false},
   {"day_of_week": 1, "open_time": "11:00", "close_time": "22:00", "is_closed": false},
   {"day_of_week": 2, "open_time": "11:00", "close_time": "22:00", "is_closed": false},
   {"day_of_week": 3, "open_time": "11:00", "close_time": "22:00", "is_closed": false},
   {"day_of_week": 4, "open_time": "11:00", "close_time": "23:00", "is_closed": false},
   {"day_of_week": 5, "open_time": "11:00", "close_time": "23:00", "is_closed": false},
   {"day_of_week": 6, "open_time": "12:00", "close_time": "22:00", "is_closed": false}]', NOW(), NOW()),
(2, 'Tokyo Sushi', 'Японский ресторан с свежими суши и сашими от шеф-повара из Токио', 2, 'Москва', 'ул. Арбат, д. 25', 2000.00, 55.749676, 37.590423, 'open',
 '[{"day_of_week": 0, "open_time": "12:00", "close_time": "23:00", "is_closed": false},
   {"day_of_week": 1, "open_time": "12:00", "close_time": "23:00", "is_closed": false},
   {"day_of_week": 2, "open_time": "12:00", "close_time": "23:00", "is_closed": false},
   {"day_of_week": 3, "open_time": "12:00", "close_time": "23:00", "is_closed": false},
   {"day_of_week": 4, "open_time": "12:00", "close_time": "00:00", "is_closed": false},
   {"day_of_week": 5, "open_time": "12:00", "close_time": "00:00", "is_closed": false},
   {"day_of_week": 6, "open_time": "12:00", "close_time": "23:00", "is_closed": false}]', NOW(), NOW()),
(3, 'El Mariachi', 'Мексиканская кухня с текилой и живой музыкой по выходным', 3, 'Санкт-Петербург', 'Невский пр., д. 50', 1200.00, 59.934280, 30.335099, 'open',
 '[{"day_of_week": 0, "open_time": "14:00", "close_time": "23:00", "is_closed": false},
   {"day_of_week": 1, "open_time": "14:00", "close_time": "23:00", "is_closed": false},
   {"day_of_week": 2, "open_time": "14:00", "close_time": "23:00", "is_closed": false},
   {"day_of_week": 3, "open_time": "14:00", "close_time": "23:00", "is_closed": false},
   {"day_of_week": 4, "open_time": "14:00", "close_time": "01:00", "is_closed": false},
   {"day_of_week": 5, "open_time": "14:00", "close_time": "02:00", "is_closed": false},
   {"day_of_week": 6, "open_time": "14:00", "close_time": "01:00", "is_closed": false}]', NOW(), NOW()),
(4, 'Burger House', 'Американские бургеры и картофель фри с авторскими соусами', 4, 'Москва', 'ул. Пушкинская, д. 10', 800.00, 55.764763, 37.605618, 'open',
 '[{"day_of_week": 0, "open_time": "10:00", "close_time": "22:00", "is_closed": false},
   {"day_of_week": 1, "open_time": "10:00", "close_time": "22:00", "is_closed": false},
   {"day_of_week": 2, "open_time": "10:00", "close_time": "22:00", "is_closed": false},
   {"day_of_week": 3, "open_time": "10:00", "close_time": "22:00", "is_closed": false},
   {"day_of_week": 4, "open_time": "10:00", "close_time": "23:00", "is_closed": false},
   {"day_of_week": 5, "open_time": "10:00", "close_time": "23:00", "is_closed": false},
   {"day_of_week": 6, "open_time": "10:00", "close_time": "22:00", "is_closed": false}]', NOW(), NOW()),
(5, 'Dragon Palace', 'Китайская кухня с уткой по-пекински и димсамами', 5, 'Санкт-Петербург', 'ул. Садовая, д. 30', 1800.00, 59.931058, 30.360909, 'open',
 '[{"day_of_week": 0, "open_time": "11:30", "close_time": "22:30", "is_closed": false},
   {"day_of_week": 1, "open_time": "11:30", "close_time": "22:30", "is_closed": false},
   {"day_of_week": 2, "open_time": "11:30", "close_time": "22:30", "is_closed": false},
   {"day_of_week": 3, "open_time": "11:30", "close_time": "22:30", "is_closed": false},
   {"day_of_week": 4, "open_time": "11:30", "close_time": "23:00", "is_closed": false},
   {"day_of_week": 5, "open_time": "11:30", "close_time": "23:00", "is_closed": false},
   {"day_of_week": 6, "open_time": "11:30", "close_time": "22:30", "is_closed": false}]', NOW(), NOW()),
(6, 'Le Petit Paris', 'Французский бистро с круассанами и утиной грудкой', 6, 'Москва', 'ул. Кузнецкий Мост, д. 5', 2500.00, 55.761627, 37.624500, 'closed',
 '[{"day_of_week": 0, "is_closed": true},
   {"day_of_week": 1, "is_closed": true},
   {"day_of_week": 2, "is_closed": true},
   {"day_of_week": 3, "is_closed": true},
   {"day_of_week": 4, "is_closed": true},
   {"day_of_week": 5, "is_closed": true},
   {"day_of_week": 6, "is_closed": true}]', NOW(), NOW()),
(7, 'Spice Garden', 'Индийская кухня с разнообразными карри и тандури', 7, 'Екатеринбург', 'ул. Ленина, д. 40', 1000.00, 56.838011, 60.597465, 'coming_soon', NULL, NOW(), NOW()),
(8, 'Mediterraneo', 'Средиземноморская кухня с морепродуктами и оливковым маслом', 8, 'Сочи', 'ул. Навагинская, д. 12', 2200.00, 43.585472, 39.723098, 'temporarily_closed',
 '[{"day_of_week": 0, "is_closed": true},
   {"day_of_week": 1, "is_closed": true},
   {"day_of_week": 2, "is_closed": true},
   {"day_of_week": 3, "is_closed": true},
   {"day_of_week": 4, "is_closed": true},
   {"day_of_week": 5, "is_closed": true},
   {"day_of_week": 6, "is_closed": true}]', NOW(), NOW()),
(9, 'Bangkok Street', 'Тайская кухня с острыми супами и пад тай', 9, 'Москва', 'ул. Большая Дмитровка, д. 8', 1300.00, 55.764041, 37.612328, 'under_renovation', NULL, NOW(), NOW()),
(10, 'Matryoshka', 'Русская кухня с блинами, пельменями и борщом', 10, 'Москва', 'ул. Старый Арбат, д. 20', 900.00, 55.749573, 37.590822, 'open',
 '[{"day_of_week": 0, "open_time": "10:00", "close_time": "20:00", "is_closed": false},
   {"day_of_week": 1, "open_time": "10:00", "close_time": "20:00", "is_closed": false},
   {"day_of_week": 2, "open_time": "10:00", "close_time": "20:00", "is_closed": false},
   {"day_of_week": 3, "open_time": "10:00", "close_time": "20:00", "is_closed": false},
   {"day_of_week": 4, "open_time": "10:00", "close_time": "21:00", "is_closed": false},
   {"day_of_week": 5, "open_time": "10:00", "close_time": "21:00", "is_closed": false},
   {"day_of_week": 6, "open_time": "10:00", "close_time": "20:00", "is_closed": false}]', NOW(), NOW());

-- ============================================
-- 4. TABLES
-- ============================================
INSERT INTO tables (id, restaurant_id, capacity, label, created_at) VALUES
-- Restaurant 1 (La Bella Italia)
(1, 1, 2, 'Столик у окна', NOW()),
(2, 1, 4, 'Центральный', NOW()),
(3, 1, 6, 'Для компании', NOW()),
(4, 1, 8, 'VIP зал', NOW()),
-- Restaurant 2 (Tokyo Sushi)
(5, 2, 2, 'У суши-бара', NOW()),
(6, 2, 4, 'Традиционный', NOW()),
(7, 2, 6, 'Татами', NOW()),
-- Restaurant 3 (El Mariachi)
(8, 3, 4, 'У сцены', NOW()),
(9, 3, 4, 'Тихое место', NOW()),
(10, 3, 8, 'Большой стол', NOW()),
-- Restaurant 4 (Burger House)
(11, 4, 2, 'Барная стойка', NOW()),
(12, 4, 4, 'Стандарт', NOW()),
(13, 4, 6, 'Семейный', NOW()),
-- Restaurant 5 (Dragon Palace)
(14, 5, 4, 'У аквариума', NOW()),
(15, 5, 6, 'Круглый стол', NOW()),
(16, 5, 10, 'Банкетный', NOW()),
-- Restaurant 6 (Le Petit Paris)
(17, 6, 2, 'Романтический', NOW()),
(18, 6, 2, 'У камина', NOW()),
(19, 6, 4, 'Бистро', NOW()),
-- Restaurant 7 (Spice Garden)
(20, 7, 4, 'Стандарт', NOW()),
(21, 7, 6, 'Большой', NOW()),
-- Restaurant 8 (Mediterraneo)
(22, 8, 2, 'На террасе', NOW()),
(23, 8, 4, 'У моря', NOW()),
(24, 8, 6, 'В помещении', NOW()),
-- Restaurant 9 (Bangkok Street)
(25, 9, 2, 'Улица', NOW()),
(26, 9, 4, 'Стандарт', NOW()),
-- Restaurant 10 (Matryoshka)
(27, 10, 4, 'Русский стиль', NOW()),
(28, 10, 6, 'Традиционный', NOW()),
(29, 10, 8, 'Для гулянки', NOW());

-- ============================================
-- 5. MENU_ITEMS
-- ============================================
INSERT INTO menu_items (id, restaurant_id, name, description, price, category, created_at) VALUES
-- Italian restaurant (ID 1)
(1, 1, 'Карбонара', 'Паста с беконом, яйцом и пармезаном', 850.00, 'Паста', NOW()),
(2, 1, 'Маргарита', 'Классическая пицца с томатами и моцареллой', 750.00, 'Пицца', NOW()),
(3, 1, 'Тирамису', 'Итальянский десерт с кофе и маскарпоне', 450.00, 'Десерты', NOW()),
(4, 1, 'Брускетта с томатами', 'Хлеб с помидорами и базиликом', 350.00, 'Закуски', NOW()),
-- Japanese restaurant (ID 2)
(5, 2, 'Филадельфия ролл', 'Ролл с лососем, сливочным сыром и огурцом', 650.00, 'Суши', NOW()),
(6, 2, 'Сашими из тунца', 'Свежий тунец с васаби и соевым соусом', 1200.00, 'Сашими', NOW()),
(7, 2, 'Мисо суп', 'Традиционный японский суп', 300.00, 'Супы', NOW()),
(8, 2, 'Темпура креветки', 'Креветки в хрустящем кляре', 800.00, 'Закуски', NOW()),
-- Mexican restaurant (ID 3)
(9, 3, 'Такос с говядиной', 'Три такоса с мясом, сальсой и гуакамоле', 600.00, 'Такос', NOW()),
(10, 3, 'Буррито с курицей', 'Большой буррито с рисом, фасолью и курицей', 750.00, 'Буррито', NOW()),
(11, 3, 'Начос с сыром', 'Чипсы с сыром, халапеньо и сметаной', 550.00, 'Закуски', NOW()),
(12, 3, 'Маргарита', 'Классический коктейль с текилой', 500.00, 'Напитки', NOW()),
-- American restaurant (ID 4)
(13, 4, 'Чизбургер', 'Бургер с говядиной, сыром и овощами', 450.00, 'Бургеры', NOW()),
(14, 4, 'Картофель фри', 'Хрустящий картофель с соусами', 250.00, 'Гарниры', NOW()),
(15, 4, 'Куриные крылышки', 'Крылышки в соусе BBQ', 600.00, 'Закуски', NOW()),
(16, 4, 'Молочный коктейль', 'Ванильный молочный коктейль', 350.00, 'Напитки', NOW()),
-- Chinese restaurant (ID 5)
(17, 5, 'Утка по-пекински', 'Утка с блинами и соусом', 1800.00, 'Основные блюда', NOW()),
(18, 5, 'Димсамы с креветками', 'Пельмени на пару с креветками', 700.00, 'Закуски', NOW()),
(19, 5, 'Кисло-сладкая свинина', 'Свинина в сладком соусе с ананасом', 850.00, 'Основные блюда', NOW()),
(20, 5, 'Рис жареный с овощами', 'Жареный рис с овощами и яйцом', 500.00, 'Гарниры', NOW());

-- ============================================
-- 6. RESTAURANT_IMAGES
-- ============================================
-- Note: column is image_url, not image_url, and there's is_main column, not alt_text
INSERT INTO restaurant_images (id, restaurant_id, image_url, is_main, created_at) VALUES
(1, 1, 'https://example.com/images/italian1.jpg', true, NOW()),
(2, 1, 'https://example.com/images/italian2.jpg', false, NOW()),
(3, 2, 'https://example.com/images/sushi1.jpg', true, NOW()),
(4, 2, 'https://example.com/images/sushi2.jpg', false, NOW()),
(5, 3, 'https://example.com/images/mexican1.jpg', true, NOW()),
(6, 3, 'https://example.com/images/mexican2.jpg', false, NOW()),
(7, 4, 'https://example.com/images/burger1.jpg', true, NOW()),
(8, 4, 'https://example.com/images/burger2.jpg', false, NOW()),
(9, 5, 'https://example.com/images/chinese1.jpg', true, NOW()),
(10, 5, 'https://example.com/images/chinese2.jpg', false, NOW());

-- ============================================
-- 7. REVIEWS
-- ============================================
-- Note: no updated_at column, but has booking_id (optional)
INSERT INTO reviews (id, restaurant_id, user_id, booking_id, rating, comment, created_at) VALUES
(1, 1, 2, NULL, 5, 'Отличная паста и обслуживание! Обязательно вернусь.', NOW()),
(2, 1, 3, NULL, 4, 'Вкусно, но немного дороговато. Пицца просто супер!', NOW()),
(3, 2, 4, NULL, 5, 'Свежайшие суши, как в Токио! Рекомендую.', NOW()),
(4, 2, 5, NULL, 4, 'Хорошее качество, но долго ждали заказ.', NOW()),
(5, 3, 6, NULL, 5, 'Отличная атмосфера и вкусные такос! Музыка классная.', NOW()),
(6, 3, 7, NULL, 3, 'Остро, но вкусно. Порции могли бы быть больше.', NOW()),
(7, 4, 8, NULL, 4, 'Бургеры сочные, картофель хрустящий. Цены адекватные.', NOW()),
(8, 4, 9, NULL, 5, 'Лучший бургер в городе! Обязательно попробуйте чизбургер.', NOW()),
(9, 5, 10, NULL, 5, 'Утка по-пекински - просто шедевр! Обслуживание на высоте.', NOW()),
(10, 5, 2, NULL, 4, 'Вкусно, но тесно в зале. Бронируйте столик заранее.', NOW());

-- ============================================
-- 8. BOOKINGS
-- ============================================
-- Note: column is comment, not special_requests
INSERT INTO bookings (id, restaurant_id, table_id, user_id, booking_date, start_time, end_time, guests_count, comment, status, created_at) VALUES
(1, 1, 1, 2, '2026-04-20', '18:00', '20:00', 2, 'Столик у окна, пожалуйста', 'confirmed', NOW()),
(2, 1, 2, 3, '2026-04-21', '19:00', '21:00', 4, 'День рождения', 'confirmed', NOW()),
(3, 2, 5, 4, '2026-04-22', '20:00', '22:00', 2, 'Хочу сидеть у суши-бара', 'pending', NOW()),
(4, 2, 6, 5, '2026-04-19', '18:30', '20:30', 4, NULL, 'confirmed', NOW()),
(5, 3, 8, 6, '2026-04-23', '21:00', '23:00', 4, 'Хочу слышать музыку', 'confirmed', NOW()),
(6, 4, 11, 7, '2026-04-24', '19:00', '21:00', 2, NULL, 'cancelled', NOW()),
(7, 4, 12, 8, '2026-04-25', '20:00', '22:00', 4, 'Аллергия на арахис', 'confirmed', NOW()),
(8, 5, 14, 9, '2026-04-26', '18:00', '20:00', 4, 'Столик у аквариума', 'pending', NOW()),
(9, 6, 17, 10, '2026-04-27', '19:30', '21:30', 2, 'Романтический ужин, цветы на столе', 'confirmed', NOW()),
(10, 7, 20, 2, '2026-04-28', '20:00', '22:00', 4, 'Не очень остро, пожалуйста', 'confirmed', NOW());

-- ============================================
-- RESET SEQUENCES (for auto-increment IDs)
-- ============================================
SELECT setval('cuisines_id_seq', (SELECT MAX(id) FROM cuisines));
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('restaurants_id_seq', (SELECT MAX(id) FROM restaurants));
SELECT setval('tables_id_seq', (SELECT MAX(id) FROM tables));
SELECT setval('menu_items_id_seq', (SELECT MAX(id) FROM menu_items));
SELECT setval('restaurant_images_id_seq', (SELECT MAX(id) FROM restaurant_images));
SELECT setval('reviews_id_seq', (SELECT MAX(id) FROM reviews));
SELECT setval('bookings_id_seq', (SELECT MAX(id) FROM bookings));

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
SELECT 'Cuisines: ' || COUNT(*) FROM cuisines;
SELECT 'Users: ' || COUNT(*) FROM users;
SELECT 'Restaurants: ' || COUNT(*) FROM restaurants;
SELECT 'Tables: ' || COUNT(*) FROM tables;
SELECT 'Menu Items: ' || COUNT(*) FROM menu_items;
SELECT 'Restaurant Images: ' || COUNT(*) FROM restaurant_images;
SELECT 'Reviews: ' || COUNT(*) FROM reviews;
SELECT 'Bookings: ' || COUNT(*) FROM bookings;
