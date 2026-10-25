#!/bin/bash
set -e

for db in "$CATALOG_DB_NAME" "$BOOKING_DB_NAME" "$REVIEW_DB_NAME"; do
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres \
    -c "CREATE DATABASE $db"
done

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$CATALOG_DB_NAME" -f /docker-entrypoint-initdb.d/init_catalog.sql
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$BOOKING_DB_NAME" -f /docker-entrypoint-initdb.d/init_booking.sql
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$REVIEW_DB_NAME"  -f /docker-entrypoint-initdb.d/init_review.sql
