#!/usr/bin/env bash
set -euo pipefail

create_user_and_db() {
  local user="$1"
  local password="$2"
  local database="$3"

  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$user') THEN
    CREATE ROLE $user LOGIN PASSWORD '$password';
  END IF;
END
\$\$;
SELECT 'CREATE DATABASE $database OWNER $user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$database')\gexec
SQL
}

create_user_and_db identity_user identity_password identity_db
create_user_and_db catalog_user catalog_password catalog_db
create_user_and_db plans_user plans_password plans_db
create_user_and_db progress_user progress_password progress_db
create_user_and_db content_user content_password content_db
create_user_and_db media_user media_password media_db
create_user_and_db notification_user notification_password notification_db
