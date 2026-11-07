#!/bin/sh
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    CREATE DATABASE user_db;
    CREATE DATABASE property_db;
    CREATE DATABASE booking_db;
    CREATE DATABASE chat_db;
EOSQL

for db in user_db property_db booking_db chat_db; do
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" -d "$db" -c 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
done

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" -d user_db < /migrations/user/001_init.sql
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" -d property_db < /migrations/property/001_init.sql
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" -d booking_db < /migrations/booking/001_init.sql
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" -d chat_db < /migrations/chat/001_init.sql
