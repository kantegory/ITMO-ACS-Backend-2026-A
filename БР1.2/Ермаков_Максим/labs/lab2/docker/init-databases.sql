SELECT 'CREATE DATABASE identity_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'identity_db')\gexec

SELECT 'CREATE DATABASE catalog_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'catalog_db')\gexec

SELECT 'CREATE DATABASE menu_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'menu_db')\gexec

SELECT 'CREATE DATABASE reservation_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'reservation_db')\gexec

SELECT 'CREATE DATABASE review_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'review_db')\gexec
