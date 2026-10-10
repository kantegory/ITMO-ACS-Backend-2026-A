CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    restaurant_id INTEGER NOT NULL,
    booking_id INTEGER NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO reviews (user_id, restaurant_id, booking_id, rating, comment) VALUES
(1, 1, 101, 5, 'Отличная паста и очень уютная атмосфера'),
(2, 1, 102, 4, 'Пицца вкусная, но пришлось немного подождать'),
(1, 2, 103, 5, 'Лучшие роллы в городе'),
(3, 2, 104, 3, 'Нормально, но дороговато'),
(2, 3, 105, 5, 'Очень вкусные хинкали'),
(1, 3, 106, 4, 'Приятная атмосфера и живая музыка'),
(3, 4, 107, 2, 'Слишком остро и шумно'),
(2, 5, 108, 5, 'Потрясающий сервис'),
(3, 5, 109, 4, 'Красивое место для ужина'),
(1, 6, 110, 5, 'Очень ароматное карри');
