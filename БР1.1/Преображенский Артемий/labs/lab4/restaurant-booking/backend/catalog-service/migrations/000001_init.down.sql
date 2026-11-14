DROP INDEX IF EXISTS reviews_restaurant_id_idx;
DROP INDEX IF EXISTS reviews_user_restaurant_uq;
DROP TABLE IF EXISTS reviews;

DROP INDEX IF EXISTS menu_items_pfc_idx;
DROP INDEX IF EXISTS menu_items_category_idx;
DROP INDEX IF EXISTS menu_items_restaurant_id_idx;
DROP TABLE IF EXISTS menu_items;

DROP INDEX IF EXISTS restaurant_tables_restaurant_id_idx;
DROP INDEX IF EXISTS restaurant_tables_restaurant_table_number_uq;
DROP TABLE IF EXISTS restaurant_tables;

DROP INDEX IF EXISTS restaurants_filters_idx;
DROP INDEX IF EXISTS restaurants_price_category_idx;
DROP INDEX IF EXISTS restaurants_cuisine_type_idx;
DROP INDEX IF EXISTS restaurants_city_idx;
DROP TABLE IF EXISTS restaurants;

DROP TYPE IF EXISTS price_category;
DROP TYPE IF EXISTS cuisine_type;
