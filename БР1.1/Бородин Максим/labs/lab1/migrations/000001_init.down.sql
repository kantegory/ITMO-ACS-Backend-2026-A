DROP INDEX IF EXISTS idx_reviews_restaurant_id;
DROP INDEX IF EXISTS idx_bookings_date;
DROP INDEX IF EXISTS idx_bookings_table_id;
DROP INDEX IF EXISTS idx_bookings_user_id;
DROP INDEX IF EXISTS idx_restaurants_price_range;
DROP INDEX IF EXISTS idx_restaurants_location;
DROP INDEX IF EXISTS idx_restaurants_cuisine_type;

DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS menu_items;
DROP TABLE IF EXISTS tables;
DROP TABLE IF EXISTS restaurant_photos;
DROP TABLE IF EXISTS restaurants;
DROP TABLE IF EXISTS users;
