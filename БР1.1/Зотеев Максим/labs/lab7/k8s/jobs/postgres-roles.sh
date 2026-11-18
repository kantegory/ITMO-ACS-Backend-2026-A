#!/bin/sh
set -eu
psql -X -q -v ON_ERROR_STOP=1 -d defaultdb -c 'REVOKE CONNECT, TEMPORARY ON DATABASE defaultdb FROM PUBLIC'
for db in identity property rental messaging; do
  ROLE_NAME=$db
  ROLE_PASSWORD=$(cat "/roles/$db")
  export ROLE_NAME ROLE_PASSWORD
  psql -X -q -v ON_ERROR_STOP=1 -d "$db" <<'SQL'
\getenv role ROLE_NAME
\getenv pass ROLE_PASSWORD
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', :'role', :'pass')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname=:'role') \gexec
SELECT format('ALTER ROLE %I PASSWORD %L', :'role', :'pass') \gexec
SELECT format('REVOKE ALL ON DATABASE %I FROM PUBLIC', current_database()) \gexec
SELECT format('GRANT CONNECT ON DATABASE %I TO %I', current_database(), :'role') \gexec
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
SELECT format('GRANT USAGE, CREATE ON SCHEMA public TO %I', :'role') \gexec
SQL
done
echo "Application logins and database grants ready"
