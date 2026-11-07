#!/bin/bash
# Создаёт по базе на каждый микросервис (database-per-service).
# Локаль en_US.UTF-8 обязательна: в базе с LC_COLLATE=C оператор ILIKE
# не сворачивает регистр кириллицы и поиск по названию рецепта не работает.
set -e

for db in lecters_users lecters_recipes lecters_social; do
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres <<-EOSQL
    SELECT 'CREATE DATABASE $db TEMPLATE template0 ENCODING ''UTF8'' LC_COLLATE ''en_US.utf8'' LC_CTYPE ''en_US.utf8'''
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$db')\gexec
EOSQL
  echo "[init] база $db готова"
done
