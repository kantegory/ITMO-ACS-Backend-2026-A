#!/usr/bin/env bash
set -Eeuo pipefail
for db in users companies dictionaries vacancies resumes applications interactions; do
  password_key="${db^^}_DB_PASSWORD"
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres -v app_password="${!password_key}" -v role="$db" -v database="${db}_db" <<'SQL'
CREATE ROLE :"role" LOGIN PASSWORD :'app_password';
CREATE DATABASE :"database" OWNER :"role";
REVOKE CONNECT ON DATABASE :"database" FROM PUBLIC;
GRANT CONNECT ON DATABASE :"database" TO :"role";
SQL
done
